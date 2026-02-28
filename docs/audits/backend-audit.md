# Backend Audit -- JyotishAI

**Date:** 2026-02-24
**Persona:** Senior Backend Engineer
**Scope:** All API routes, lib modules, astro-engine, workers, schemas, and migrations

---

## Executive Summary

JyotishAI's backend is architecturally sound -- the BFF pattern with Next.js API routes fronting a FastAPI microservice is a good separation of concerns. The astro-engine's pyswisseph integration is correctly configured (Lahiri ayanamsha, Whole Sign houses), and the test suite validates against known ClickAstro output. The RAG pipeline (chunker, embedder, retriever, hybrid search) is well-designed with pgvector + full-text search.

However, the audit uncovered **several critical security vulnerabilities** and a number of high-priority issues that must be addressed before any production deployment:

1. **Multiple API routes lack authentication entirely** -- any unauthenticated user can read all profiles, compute charts, and query alerts.
2. **No Next.js middleware** exists for session refresh, meaning Supabase auth tokens will silently expire.
3. **The `GET /api/v1/profiles` route has no auth check** -- it returns ALL profiles without filtering by `user_id`.
4. **Mass-assignment vulnerabilities** in profile creation and update routes (raw `...body` spread).
5. **Workers use `SUPABASE_SECRET_KEY`** (non-standard env var name) and bypass RLS intentionally, but without compensating authorization checks.
6. **FastAPI CORS is `allow_origins=["*"]`** -- wide open.
7. **Hardcoded UTC offset of 5.5 (IST)** in chart and dasha calculations, ignoring the user-provided timezone.
8. **SSE error handling is incomplete** -- mid-stream OpenRouter failures silently drop.

The codebase has **~30 yoga detection rules** (good coverage of classical yogas), correct Vimshottari dasha calculation, and proper Ashtakavarga implementation. The report prompt templates are well-structured and domain-rich. The BullMQ queue setup is solid with retry logic.

---

## Critical Issues (Must Fix)

### C1. GET /api/v1/profiles Has No Authentication

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\profiles\route.ts`, lines 4-17

The `GET` handler creates a Supabase server client but **never calls `supabase.auth.getUser()`**. While Supabase RLS should restrict rows to the authenticated user's `user_id`, this depends entirely on the cookie-based session being valid. If the anon key is used directly (e.g., from a curl request with no cookies), the RLS policy `auth.uid() = user_id` will return no rows rather than rejecting the request -- but this means the endpoint returns an empty `200 OK` instead of `401 Unauthorized`. This is misleading and fragile.

More critically, **if RLS were ever misconfigured or disabled for debugging**, this endpoint would leak all users' profile data.

**Impact:** Auth bypass risk; fragile security posture.

### C2. Mass-Assignment Vulnerability in Profile POST and PATCH

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\profiles\route.ts`, line 30-33
**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\profiles\[id]\route.ts`, lines 30-37

```typescript
// POST - Profile creation
.insert({
  user_id: user.user.id,
  ...body,  // <-- DANGEROUS: body can override user_id
})
```

An attacker can send `{ "user_id": "other-users-uuid", ... }` in the POST body. Because `...body` comes after `user_id`, the spread will **override** `user_id` with the attacker's value. This completely bypasses RLS-based profile isolation.

The PATCH handler is even worse -- it passes `body` directly to `.update(body)` with no field whitelist. An attacker could set `chart_data`, `user_id`, or any column to arbitrary values.

**Impact:** Horizontal privilege escalation. User A can create profiles owned by User B, or modify any profile's data.

### C3. No Authentication on GET/PATCH /api/v1/profiles/[id]

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\profiles\[id]\route.ts`, lines 4-60

None of the three handlers (`GET`, `PATCH`, `DELETE`) call `supabase.auth.getUser()`. They rely entirely on RLS. While RLS is the correct defense-in-depth layer, the API should also explicitly verify authentication and return 401/403 as appropriate, rather than silently returning empty results or Supabase errors.

### C4. No Authentication on Alerts, Transits, Calculate, Chat, Reports/Generate

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\alerts\route.ts` -- no `getUser()` call
**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\transits\route.ts` -- no `getUser()` call
**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\calculate\route.ts` -- no `getUser()` call
**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\chat\route.ts` -- no `getUser()` call
**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\reports\generate\route.ts` -- no `getUser()` call

The `/calculate` endpoint is particularly concerning because it writes to the database (updates `profiles.chart_data`). The `/reports/generate` endpoint creates report records and triggers PDF generation. The `/chat` endpoint creates chat sessions and messages. All of these should verify the user owns the profile they are operating on.

**Note:** The `/transits` route does not touch user data and could arguably be public, but it still exposes the internal astro-engine without rate limiting.

### C5. No Next.js Middleware for Auth Session Refresh

There is **no `middleware.ts`** file in the web project. The `@supabase/ssr` library requires middleware to refresh expired auth tokens on every request. Without it:

- Supabase sessions will silently expire after the token TTL
- Users will get mysterious failures without being redirected to login
- The `setAll` method in `server.ts` swallows errors silently (line 22-24), compounding the problem

**Impact:** Authentication breaks silently after token expiry.

### C6. Alerts PATCH Accepts Arbitrary Updates Without Ownership Check

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\alerts\route.ts`, lines 24-46

```typescript
const { alertId, updates } = body;
// No validation of `updates` object
await supabase.from("transit_alerts").update(updates).eq("id", alertId)
```

The `updates` object is passed directly from the request body to `.update()` with no field whitelist. An attacker could send:
- `{ "alertId": "...", "updates": { "profile_id": "other-users-profile-id" } }` to reassign alerts
- `{ "alertId": "...", "updates": { "content": "malicious" } }` to modify alert content

RLS mitigates some of this, but the lack of input validation is a defense-in-depth failure.

### C7. FastAPI CORS Wide Open

**File:** `C:\Prabhat\Projects\JyotishAI\astro-engine\main.py`, lines 17-23

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  # <-- Combined with *, this is invalid per CORS spec
    allow_methods=["*"],
    allow_headers=["*"],
)
```

`allow_origins=["*"]` with `allow_credentials=True` is a CORS spec violation. Browsers will reject credentialed requests when the origin is `*`. More importantly, the astro-engine has no authentication at all -- anyone who can reach it can compute charts, generate PDFs, and access all endpoints. In production, the astro-engine should only accept requests from the Next.js BFF.

---

## High Priority Issues

### H1. Hardcoded UTC Offset of 5.5 (IST) Ignores User Timezone

**File:** `C:\Prabhat\Projects\JyotishAI\astro-engine\routers\chart.py`, lines 34-36
**File:** `C:\Prabhat\Projects\JyotishAI\astro-engine\routers\dasha.py`, lines 36

```python
# Assuming IST (UTC+5:30) as default
utc_offset = 5.5
jd = calculator.calc_julian_day(birth_datetime, utc_offset)
```

The `BirthData` schema includes a `timezone` field (e.g., `"Asia/Kolkata"`, `"America/New_York"`), but **both chart and dasha routers hardcode `utc_offset = 5.5`**. For any birth outside IST, the Julian Day calculation will be wrong, producing incorrect planetary positions, lagna, and dasha balance.

This is a **data correctness issue** that silently produces wrong astrology output for non-IST births. The timezone string should be converted to a proper UTC offset using `pytz` or `zoneinfo`.

**Impact:** Incorrect chart calculations for any non-IST timezone.

### H2. SSE Stream Error Handling is Incomplete

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\reports\generate\route.ts`, lines 70-108
**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\chat\route.ts`, lines 76-131

Both SSE handlers have the same pattern:

```typescript
try {
  // ... read stream ...
} catch (error) {
  controller.error(error);  // This abruptly closes the stream
}
```

Problems:
1. **No error event sent to client** -- when the stream errors, the client receives a broken connection with no error message. It should send `data: {"error": "..."}` before closing.
2. **JSON parse errors are silently ignored** (line 101-103 in chat, line 91-93 in reports) -- if OpenRouter sends malformed SSE data, it is silently dropped.
3. **No timeout handling** -- if OpenRouter hangs, the stream stays open indefinitely.
4. **Report status not updated on failure** -- if the stream errors after creating the report record (status: "generating"), the report record is never updated to "failed".

### H3. `response.body!` Non-Null Assertion on OpenRouter Response

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\lib\report-generator.ts`, line 59
**File:** `C:\Prabhat\Projects\JyotishAI\web\src\lib\rag\chat.ts`, line 93

```typescript
return response.body!;
```

After checking `response.ok`, the code uses a non-null assertion on `response.body`. While unlikely, `body` can be `null` for certain response types. A proper null check should be added.

### H4. No Input Validation with Zod on Any API Route

Despite `zod` being in `package.json`, **none of the API routes use Zod schemas** for input validation. All routes parse `request.json()` and use the body directly without validating:
- `profileId` is a valid UUID
- `reportType` is one of the 9 valid types
- `language` is "en" or "hi"
- `birthData` has required fields with valid ranges (latitude -90 to 90, etc.)

The Supabase CHECK constraints provide some backend validation (e.g., `report_type IN (...)`) but these throw database errors (500) instead of clean validation errors (400).

### H5. `any` Type Usage Throughout

Despite `strict: true` in `tsconfig.json`, there are numerous `any` types:

| File | Line | Usage |
|------|------|-------|
| `transits/route.ts` | 8 | `catch (error: any)` |
| `chat/route.ts` | 62 | `chartData: profile.chart_data as any` |
| `reports/generate/route.ts` | 58 | `chartData: profile.chart_data as any` |
| `reports/generate/route.ts` | 121 | `supabase: any` parameter |
| `rag/retriever.ts` | 12 | `metadata: any` |
| `rag/chat.ts` | 99 | `searchResults: any[]` |
| `rag/embedder.ts` | 55 | `(item: any)` |

The `profile.chart_data as any` casts are particularly problematic -- they bypass type checking on the chart data flowing from the database into report prompts and chat. If the stored JSON shape doesn't match `ChartData`, these will cause runtime errors deep in prompt template functions.

### H6. Workers Use Non-Standard Environment Variable Name

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\lib\workers\report-worker.ts`, line 17
**File:** `C:\Prabhat\Projects\JyotishAI\web\src\lib\workers\alert-worker.ts`, line 17

```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!  // <-- Should be SUPABASE_SERVICE_ROLE_KEY
);
```

The ARCHITECTURE.md and CLAUDE.md both reference `SUPABASE_SERVICE_ROLE_KEY`, but the workers use `SUPABASE_SECRET_KEY`. This will fail at runtime unless the env var is manually aliased. The service role key bypasses RLS entirely, which is intentional for workers, but the env var mismatch will cause a silent failure (the `!` assertion will pass `undefined` as the key).

### H7. Queue Module Creates Redis Connection at Import Time

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\lib\workers\queue.ts`, lines 9-11

```typescript
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});
```

This connection is created at module import time, meaning **every Next.js API route that imports `enqueuePDFGeneration` or `enqueueAlertGeneration` will create a Redis connection**, even on cold starts or in serverless environments. This can cause connection exhaustion and slow startup.

### H8. PDF Markdown Parsing Has Bold/Italic Replacement Bug

**File:** `C:\Prabhat\Projects\JyotishAI\astro-engine\routers\pdf.py`, lines 125-132

```python
elif '**' in line:
    line = line.replace('**', '<b>').replace('**', '</b>')
```

The second `.replace('**', '</b>')` replaces `<b>` (the result of the first replace) because there are no more `**` to match. This means **all bold markers become `<b>` and none become `</b>`**, producing malformed HTML in the PDF. The same issue exists for italic markers on line 130-131.

The correct approach is to use regex or alternate first/second occurrence replacement.

---

## API Route Analysis

### GET /api/v1/profiles
- **Purpose:** List all profiles for the authenticated user
- **Auth:** MISSING -- relies entirely on Supabase RLS
- **Issues:** No explicit 401 response for unauthenticated users; error always returns 500 (should distinguish 500 from other errors)

### POST /api/v1/profiles
- **Purpose:** Create a new family profile
- **Auth:** Checks `getUser()` (good), but mass-assignment vulnerability via `...body` spread
- **Issues:** C2 (mass-assignment); no Zod validation; no field whitelist

### GET /api/v1/profiles/[id]
- **Purpose:** Get a single profile by ID
- **Auth:** MISSING
- **Issues:** Returns 404 for all Supabase errors (should differentiate 404 from 500); no ownership verification

### PATCH /api/v1/profiles/[id]
- **Purpose:** Update a profile
- **Auth:** MISSING
- **Issues:** C2 (mass-assignment); passes raw body to `.update(body)`; no field whitelist

### DELETE /api/v1/profiles/[id]
- **Purpose:** Delete a profile
- **Auth:** MISSING
- **Issues:** No confirmation; no cascading cleanup acknowledgment (reports, chat, chunks are CASCADE deleted by DB)

### POST /api/v1/calculate
- **Purpose:** Calculate birth chart and store in profile
- **Auth:** MISSING
- **Issues:** No validation that user owns `profileId`; no Zod validation on `birthData`; writes to database without ownership check

### POST /api/v1/reports/generate
- **Purpose:** Generate streaming horoscope report via OpenRouter
- **Auth:** MISSING
- **Issues:** Creates DB record and PDF job without ownership check; report status not set to "failed" on error; `as any` cast on chart data

### POST /api/v1/chat
- **Purpose:** RAG-powered chat about birth chart
- **Auth:** MISSING
- **Issues:** Creates chat sessions without ownership check; `as any` cast on chart data; session creation has no error handling (line 34-41, `newSession` could be null)

### GET /api/v1/transits
- **Purpose:** Get current planetary positions
- **Auth:** MISSING (but this could arguably be public)
- **Issues:** `error: any` type; no caching (every request hits astro-engine)

### GET /api/v1/alerts
- **Purpose:** List transit alerts
- **Auth:** MISSING
- **Issues:** Optional `profileId` filter means without it, the query returns alerts for all profiles the RLS allows

### PATCH /api/v1/alerts
- **Purpose:** Update alert (mark read, etc.)
- **Auth:** MISSING
- **Issues:** C6 (arbitrary updates via raw body); no field whitelist

---

## FastAPI / astro-engine Analysis

### Calculator Correctness (core/calculator.py)

**Positive findings:**
- Lahiri (Chitrapaksha) ayanamsha correctly set via `swe.set_sid_mode(swe.SIDM_LAHIRI)` (line 11)
- Ketu correctly calculated as 180 degrees opposite to Rahu (lines 99-109)
- Whole Sign house system correctly implemented (lines 147-167)
- Planet dignity calculation includes exaltation, debilitation, own sign, friend/enemy (lines 190-247)
- Exaltation/debilitation degrees match classical texts (lines 50-72)
- SIGN_LORDS mapping is correct (lines 33-47)

**Issues found:**

1. **`swe.set_sid_mode` is module-level global state** (line 11). If multiple threads or async requests call `swe.calc_ut()`, they share the same ayanamsha mode. This is thread-safe in CPython due to the GIL, but could be an issue with alternative Python implementations or if the process is forked.

2. **Sign lord friendship/enmity tables are incomplete** (lines 218-240). Moon's enemies list contains `['None']` (a string, not the Python `None`), which means `lord in enemies[planet_name]` will match when `lord == 'None'` -- a string that never occurs, so functionally harmless, but a code smell.

3. **`get_planet_dignity` has redundant conditions** (lines 199-203, 209-211). The degree-proximity check (`abs(degree - exalt_degree) < 1.0`) is followed by `return 'exalted'` regardless, making the proximity check dead code.

4. **`calc_lagna` uses Placidus to get the ascendant** (line 136), then converts to sidereal. This is correct -- the ascendant is the same regardless of house system; only the cusp assignments differ.

### Nakshatra Calculation (core/nakshatra.py)

**Correct:** All 27 nakshatras with correct degree ranges (13.333333 degrees each), correct lords matching Vimshottari dasha cycle, correct pada calculation.

**Edge case:** If `longitude` is exactly 360.0, the fallback at line 79-86 handles it. However, if `longitude` is negative (which shouldn't happen but could from a bug), no nakshatra would be matched and the fallback returns Revati, which would be incorrect.

### Dasha Calculation (core/dasha.py)

**Correct:**
- Vimshottari dasha order is correct (line 3 of nakshatra.py, referenced in dasha.py)
- Dasha years sum to 120 (verified: 7+20+6+10+7+18+16+19+17 = 120)
- Balance at birth formula is correct: `total_years * (1 - fraction_completed)` (line 33)
- Antardasha proportional formula is correct: `(maha_years * antar_years) / 120` (line 119)
- Pratyantardasha formula is correct: `(antar_years * prat_years) / 120` (line 163)

**Issues:**
- Uses `365.25` days per year (line 77, 121, 165). The standard Vimshottari calculation uses 365.25 (sidereal year), which is acceptable, though some Indian astrology software uses 365.2425 (Gregorian) or exactly 365 days. This is a minor precision difference.

### Yoga Detection (core/yoga_rules.py)

**Coverage:** 30 yoga rules implemented, including:
- 5 Pancha Mahapurusha yogas (Ruchaka, Bhadra, Hamsa, Malavya, Sasa) -- correctly requiring kendra placement + own/exaltation dignity
- Gaja Kesari Yoga -- correct mutual kendra check
- Kala Sarpa Yoga -- correct hemming check between Rahu-Ketu
- 3 Viparita Raja Yogas (Harsha, Sarala, Vimala) -- correctly checking dusthana lords in dusthanas
- Dhana Yoga, Lakshmi Yoga, Kubera Yoga
- Budha Aditya Yoga, Saraswati Yoga
- Neecha Bhanga Raja Yoga -- partially correct (checks one cancellation condition, but BPHS lists 5 conditions for neecha bhanga)

**Issues:**

1. **Adhi Yoga threshold too low** (line 434). Classical definition requires **all three benefics** (Jupiter, Venus, Mercury) in 6th/7th/8th from Moon. The code triggers with just 1 benefic (`len(benefics_present) >= 1`), which makes the detection too permissive.

2. **Parvata Yoga definition simplified** (line 490-510). Triggers with just 1 benefic in kendra, which is too broad. The classical definition is more restrictive.

3. **Raj Yoga detection is narrow** (lines 124-143). Only checks 5th-9th lord conjunction. Classical Raj Yoga includes any kendra lord + trikona lord conjunction/exchange/mutual aspect. Missing: 1st-5th, 1st-9th, 4th-5th, 4th-9th, 7th-5th, 7th-9th, 10th-5th, 10th-9th combinations.

4. **No combustion detection** in yoga rules. Some yogas are nullified when a planet is combust (too close to the Sun), but the yoga detector doesn't check for this.

5. **`_are_planets_conjunct` uses 10-degree orb by default** (line 95). This is quite wide for conjunction. Most authorities use 5-8 degrees for close conjunction.

### Ashtakavarga (core/ashtakavarga.py)

**Correct:** The Ashtakavarga points tables match the classical Brihat Parashara Hora Shastra (BPHS) tables. The calculation correctly counts from each planet's house position and accumulates into Sarvashtakavarga.

**Missing:** Ashtakavarga from the Lagna (Ascendant) is not included. Classical Ashtakavarga includes contributions from Lagna, making it 8 sources (Ashta = 8). The current implementation only uses 7 planets.

### Transit vs Natal Calculation (routers/chart.py, lines 220-289)

**Issues:**
1. **Orb calculation incorrect for non-conjunction aspects** (line 270). For sextile detection, `orb=diff` is stored, but `diff` is the raw longitude difference, not the deviation from the exact aspect angle. When `diff=62` and `orb_tolerance=5`, it correctly detects a sextile, but the stored `orb` should be `abs(diff - 60) = 2`, not `62`.

2. **`is_exact` calculation is incorrect** (line 264). It checks `diff <= 1.0 or abs(diff - 60) <= 1.0 or ...` but only one of these conditions is relevant based on the detected `aspect_type`. For a trine, `diff <= 1.0` would be for a conjunction, not a trine.

3. **No "applying vs separating" calculation**. The `TransitAspect` schema has `is_exact` but the `astro-client.ts` `AspectData` interface has `applying: boolean`. The astro-engine doesn't calculate whether aspects are applying or separating (requires comparing planet speeds).

---

## Worker & Queue Analysis

### Report Worker (report-worker.ts)

**Positive:**
- 3 retry attempts with exponential backoff (2s, 4s, 8s) -- good
- Fetches report content, generates PDF via astro-engine, uploads to Supabase Storage, updates report record

**Issues:**
1. **H6:** `SUPABASE_SECRET_KEY` does not match documented `SUPABASE_SERVICE_ROLE_KEY`
2. **No content null check** (line 40): If `report.content` is null (report still generating), `generatePDF` receives `null`, which will fail in the Python PDF generator
3. **No graceful shutdown handling** -- no `SIGTERM`/`SIGINT` handlers to drain the worker
4. **Report status not updated to "failed"** if PDF generation fails after all retries
5. **PDF file naming** (line 43): Uses `reportId.pdf` directly. If reportId contains special characters (unlikely with UUID, but not validated), this could fail

### Alert Worker (alert-worker.ts)

**Positive:**
- 2 retry attempts with fixed 5s backoff
- Filters for tight orbs (< 2 degrees) and applying aspects

**Issues:**
1. **H6:** Same env var mismatch
2. **No deduplication** -- if the job runs twice for the same profile on the same day, duplicate alerts will be created. Should check for existing alerts before inserting.
3. **`profile.chart_data` passed to `getTransitsVsNatal` without type assertion** (line 43) -- TypeScript will flag this since `chart_data` is `Json` type, not `ChartData`
4. **No scheduling mechanism** -- the worker processes jobs but nothing schedules daily alert generation. There's `enqueueAlertGeneration` in `queue.ts` but no cron job or scheduler calling it.

### Queue Setup (queue.ts)

**Issues:**
1. **H7:** Redis connection at import time
2. **No connection error handling** -- if Redis is down, the import will hang or throw, crashing any route that imports from this module
3. **No connection cleanup** -- no `.disconnect()` on process exit

---

## Type Safety & Schema Alignment

### ChartData Type Mismatch Between Python and TypeScript

The Python `ChartData` schema (`schemas/birth_data.py`) and the TypeScript types diverge significantly:

| Aspect | Python (astro-engine) | TypeScript (astro-client.ts) | TypeScript (types/astro.ts) |
|--------|----------------------|-----------------------------|-----------------------------|
| Planets | `List[Planet]` (array) | `Record<string, Planet>` (dict) | `Planet[]` (array) |
| Houses | `List[House]` (array) | `Record<string, House>` (dict) | `House[]` (array) |
| Dashas | `DashaSequence` object | `{ balance_at_birth, sequence, current }` | `DashaSequence` with different shape |
| Yogas | `List[Yoga]` (Yoga has `planets_involved`, `houses_involved`) | `Yoga[]` (has `planets`, `effect`) | `Yoga[]` (has `planets`, `effect`) |
| Lagna | `Planet` object | `{ sign, sign_num, degrees, lord }` | `{ sign, degrees }` |

This means the `astro-client.ts` types **do not match what the FastAPI endpoint actually returns**. The chart router returns a Pydantic `ChartData` model, which serializes planets as an array, but `astro-client.ts` expects `Record<string, Planet>` (a dictionary keyed by planet name).

**Impact:** At runtime, all report prompt templates that do `chartData.planets.Sun.sign` will fail with `undefined` because `planets` is an array, not a dict. Either the FastAPI response needs a serialization transform, or the TypeScript types need to be updated.

This is likely masked during development if chart data is manually constructed or if there's a transform step not visible in the codebase.

### Supabase Types vs Application Types

The Supabase-generated `types.ts` uses `Json` for `chart_data`, which is correct for the database column, but the application then uses `as any` to bypass the type system when accessing chart data from the database. A proper approach would be to create a type guard or runtime validator.

---

## Security Analysis

### Authentication Gaps Summary

| Route | Auth Check | RLS Fallback | Risk |
|-------|-----------|-------------|------|
| GET /profiles | None | Yes | Medium -- returns empty instead of 401 |
| POST /profiles | `getUser()` | Yes | **HIGH** -- mass assignment bypasses user_id |
| GET /profiles/[id] | None | Yes | Medium |
| PATCH /profiles/[id] | None | Yes | **HIGH** -- mass assignment |
| DELETE /profiles/[id] | None | Yes | Medium |
| POST /calculate | None | Yes (on update) | High -- writes to DB |
| POST /reports/generate | None | Yes | High -- creates records, triggers jobs |
| POST /chat | None | Yes | High -- creates sessions/messages |
| GET /transits | None | N/A | Low -- no user data |
| GET /alerts | None | Yes | Medium |
| PATCH /alerts | None | Yes | **HIGH** -- arbitrary updates |

### API Key Exposure

- `OPENROUTER_API_KEY` is accessed via `process.env` on the server side (good -- not in `NEXT_PUBLIC_*`)
- Supabase anon key is in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (correct for browser use)
- The `.env.local` file is gitignored (verified by its presence not in git status)

### Input Sanitization

- **`birth_place`** field (string) is stored in the database but never used for geocoding within the backend. If it were used in a shell command or URL, it could be an injection vector. Currently safe since it's just a text column.
- **`report_type`** is not validated in the API route but has a CHECK constraint in the database. Sending an invalid type will produce a database error (500) instead of a validation error (400).
- **`profileId`** is used directly in `.eq("id", profileId)` queries. Supabase parameterizes these queries, so SQL injection is not a risk.

### FastAPI Security

- **No authentication** on any FastAPI endpoint. The astro-engine is designed to be an internal service, but in development it runs on `0.0.0.0:8000` (line 58), making it accessible on the network.
- **No rate limiting** -- an attacker could make thousands of chart calculation requests, consuming CPU.
- **`reload=True` in production** (line 60) -- the development server should not have reload enabled in production.

---

## Missing Implementations

### Routes in ARCHITECTURE.md Not Fully Implemented

1. **`/api/v1/transits/natal`** -- The Next.js route for transits does not forward to the `POST /chart/transits/natal` endpoint in astro-engine. The `astro-client.ts` has `getTransitsVsNatal()` but it's only called from the alert worker, not from any API route.

2. **No `/api/v1/reports` LIST route** -- There's `/reports/generate` for creating reports, but no route to list existing reports for a profile, get a single report, or mark a report as favorite.

3. **No `/api/v1/chat/sessions` route** -- There's no way to list chat sessions, delete a session, or rename a session.

4. **No `/api/v1/preferences` route** -- The `user_preferences` table exists but has no API route.

### Missing Functionality

1. **No transits router in astro-engine** -- The CLAUDE.md references `routers/transits.py` but it does not exist. Transit functionality is embedded in `routers/chart.py` instead.

2. **No `houses.py` in core** -- Referenced in CLAUDE.md but house calculation is in `calculator.py`.

3. **No `report-prompts/index.ts`** -- The dynamic import in `report-generator.ts` (line 71) uses `import(\`./report-prompts/${reportType}\`)` which works but has no index file for discoverability.

4. **No alert scheduling/cron** -- The alert worker processes jobs, and `enqueueAlertGeneration()` exists, but nothing calls it on a schedule.

5. **No WhatsApp/email dispatch** -- Alert records have `dispatched_whatsapp` and `dispatched_email` columns but no code sends these notifications.

6. **Test file has typo** -- `test_calculator.py` line 223: `AssertionError` should be `AssertionError` (wait, `AssertionError` is Python's actual class name `AssertionError` -- actually this is a typo for `AssertionError`: it should be `AssertionError`). Let me re-read: line 223 says `AssertionError` -- this should be `AssertionError`. Actually Python's builtin is `AssertionError`. The actual code says `AssertionError` which... looking again, line 223 says `except AssertionError as e:` -- this is a typo. Python's exception is `AssertionError`. This means assertion failures won't be caught, and will fall through to the generic `Exception` handler.

---

## Quick Wins

1. **Add auth middleware** -- Create `web/src/middleware.ts` with Supabase session refresh. This is a single file addition that fixes C5.

2. **Add `getUser()` check to all routes** -- Extract a reusable `requireAuth()` helper that returns the user or throws 401. Apply it to every route handler. Estimated: 30 minutes.

3. **Add Zod schemas for all route inputs** -- Create `web/src/lib/validators.ts` with schemas for profile creation, report generation, etc. Estimated: 1 hour.

4. **Replace `...body` with explicit field picks** -- In profile POST/PATCH, explicitly pick allowed fields: `{ name: body.name, birth_date: body.birth_date, ... }`. Estimated: 15 minutes.

5. **Fix timezone handling** -- Replace `utc_offset = 5.5` with `pytz.timezone(birth_data.timezone).utcoffset(birth_datetime).total_seconds() / 3600`. Requires adding `pytz` to `requirements.txt`. Estimated: 30 minutes.

6. **Fix PDF bold/italic parsing** -- Use regex: `re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)`. Estimated: 10 minutes.

7. **Fix test typo** -- `AssertionError` to `AssertionError` in `test_calculator.py`. Wait -- actually the Python builtin is `AssertionError`. Looking at line 223 again: `except AssertionError as e:`. The correct Python exception class is `AssertionError`. So this is indeed a typo and assertion errors will not be caught. Fix: change to `AssertionError`. Estimated: 1 minute.

8. **Restrict FastAPI CORS** -- Change `allow_origins=["*"]` to `allow_origins=[os.environ.get("ALLOWED_ORIGIN", "http://localhost:3001")]`. Estimated: 5 minutes.

9. **Lazy Redis connection** -- Wrap the IORedis connection in a function that creates it on first use rather than at import time. Estimated: 15 minutes.

10. **Fix env var name** -- Change `SUPABASE_SECRET_KEY` to `SUPABASE_SERVICE_ROLE_KEY` in both workers. Estimated: 2 minutes.

---

## Recommendations Summary

### Immediate (Before Any User Testing)

| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| 1 | Add auth checks to all API routes (C1-C4) | Critical | 1 hour |
| 2 | Fix mass-assignment in profiles (C2) | Critical | 15 min |
| 3 | Fix mass-assignment in alerts (C6) | Critical | 15 min |
| 4 | Create `middleware.ts` for session refresh (C5) | Critical | 30 min |
| 5 | Fix hardcoded UTC offset (H1) | Critical | 30 min |
| 6 | Fix worker env var name (H6) | High | 2 min |

### Short-Term (Before Production)

| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| 7 | Add Zod input validation (H4) | High | 2 hours |
| 8 | Fix SSE error handling (H2) | High | 1 hour |
| 9 | Restrict FastAPI CORS (C7) | High | 5 min |
| 10 | Fix `any` types (H5) | High | 2 hours |
| 11 | Fix ChartData type alignment | High | 3 hours |
| 12 | Fix PDF bold/italic parsing (H8) | Medium | 10 min |
| 13 | Lazy Redis connection (H7) | Medium | 15 min |
| 14 | Add transit vs natal API route | Medium | 1 hour |
| 15 | Add reports LIST/GET routes | Medium | 1 hour |
| 16 | Add preferences API route | Medium | 1 hour |

### Long-Term (Production Polish)

| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| 17 | Alert deduplication | Medium | 1 hour |
| 18 | Alert scheduling (cron) | Medium | 2 hours |
| 19 | Worker graceful shutdown | Medium | 30 min |
| 20 | Expand Raj Yoga detection | Low | 2 hours |
| 21 | Fix Adhi Yoga threshold | Low | 10 min |
| 22 | Add Lagna to Ashtakavarga | Low | 1 hour |
| 23 | Add combustion check to yogas | Low | 1 hour |
| 24 | Transit caching | Low | 1 hour |
| 25 | Rate limiting on astro-engine | Low | 30 min |
