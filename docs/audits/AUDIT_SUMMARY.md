# JyotishAI Consolidated Audit Summary

**Date:** 2026-02-24
**Synthesized from:** 5 audit reports (UX/UI, Backend, Architecture, Database, Devil's Advocate)

---

## End-to-End Viability Assessment

**Current state: ~25-30% complete. No end-to-end user flow works beyond basic profile CRUD.**

| User Action | Status | Blocking Issues |
|-------------|--------|-----------------|
| Sign up / Log in | WORKS | Auth session refresh missing (tokens expire silently) |
| Create family profile | WORKS | No field validation (relies on DB constraints) |
| Calculate birth chart | LIKELY WORKS (IST only) | Hardcoded IST offset; no timezone parsing |
| View chart visualization | BROKEN | `/chart/[id]` page route does not exist |
| Generate horoscope report | CRASHES | ChartData type mismatch (array vs object); report prompts access `planets.Sun.sign` on an array |
| View generated report | BROKEN | `/reports/[id]` page route does not exist |
| AI chat about chart | CRASHES | Same ChartData type mismatch; ChatInterface uses mock data; `/chat/[id]` route does not exist |
| See transit alerts | BROKEN | Alert worker filter uses nonexistent `applying` field; returns zero results |
| Export PDF | BROKEN | Worker can't start (no compiled JS); PDF schema mismatch; storage bucket doesn't exist |
| Receive WhatsApp/email alerts | NOT IMPLEMENTED | No dispatch code exists |

**Bottom line:** A user can sign up, create a profile, and calculate a chart (for IST births). They then see a raw data table with no visualizations, no reports, no chat, and no export capability.

---

## Top 10 Issues to Fix (Prioritized by Impact)

### 1. ChartData Type Mismatch Between Python and TypeScript
**Source:** Backend H5, Database HIGH-7, Devil's Advocate
**Effort:** 3-4 hours
**Impact:** Reports and chat will CRASH at runtime. The astro-engine returns `planets` and `houses` as arrays. Report prompts and RAG chat access them as objects (`planets.Sun.sign`, `houses["10"].lord`). This is not a type safety issue -- it's a guaranteed `Cannot read property of undefined` crash on the app's primary features.
**Fix:** Consolidate to one `ChartData` type. Either transform the Python response to match the TypeScript object form, or update all prompt templates and chat.ts to use array access with `.find()`.

### 2. Three Missing Page Routes (Chart, Reports, Chat)
**Source:** UX Critical #2-4
**Effort:** 6-9 hours total
**Impact:** Users have no way to see chart visualizations, view reports, or access AI chat. The components exist but are orphaned -- no page imports them.
**Fix:** Create `(main)/chart/[id]/page.tsx`, `(main)/reports/[id]/page.tsx`, and `(main)/chat/[id]/page.tsx`.

### 3. Auth Middleware Not Wired
**Source:** Backend C5, Architecture C5
**Effort:** 5 minutes
**Impact:** All API routes are unprotected. `proxy.ts` has auth logic but is never exported as Next.js middleware.
**Fix:** Create `web/src/middleware.ts` with `export { proxy as middleware, config } from './proxy';`

### 4. Environment Variable Name Mismatches
**Source:** Architecture C2
**Effort:** 30 minutes
**Impact:** All Supabase operations silently fail. Code uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`, but `.env.example` defines `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
**Fix:** Standardize all code to match Supabase documentation naming.

### 5. Mass-Assignment Vulnerabilities (3 endpoints)
**Source:** Backend C2, C6; Database CRIT-1, CRIT-2, CRIT-3
**Effort:** 30 minutes
**Impact:** Horizontal privilege escalation. Profile POST spreads `...body` after `user_id` (body overrides). Profile PATCH and Alerts PATCH pass raw body to `.update()` with no field whitelist.
**Fix:** Explicit field picking on all insert/update operations.

### 6. URL Routing Mismatch (Transit Endpoints)
**Source:** Architecture, verified by Devil's Advocate
**Effort:** 10 minutes
**Impact:** Transit API and alert worker return 404. `astro-client.ts` calls `/transits` but the FastAPI endpoint is at `/chart/transits`.
**Fix:** Update URLs in `astro-client.ts`.

### 7. Hardcoded IST Timezone in Chart Calculation
**Source:** Backend H1, Architecture C3
**Effort:** 30 minutes
**Impact:** Incorrect chart calculations for any non-IST birth. The `birth_data.timezone` field is ignored; UTC offset is always 5.5.
**Fix:** Parse timezone with `zoneinfo` (Python stdlib) and compute actual UTC offset.

### 8. Yoga Detection False Positives (4-6 rules)
**Source:** Backend (partial), Devil's Advocate (verified)
**Effort:** 2 hours
**Impact:** Misleading astrological output. Adhi Yoga fires with 1 benefic (should require 3), Parvata Yoga fires with 1 benefic in kendra (should have stricter conditions), Lakshmi Yoga ignores Venus requirement, Budha Aditya Yoga uses 15-degree orb (fires on nearly every chart), Viparita Raja Yoga creates duplicate detections.
**Fix:** Tighten thresholds to match classical definitions.

### 9. PDF Generation Pipeline Broken (3 separate issues)
**Source:** Architecture C4, Architecture H2, Database
**Effort:** 3 hours
**Impact:** No PDFs can be generated. (a) Worker Dockerfile references nonexistent compiled JS. (b) Worker sends `report_id`/`report_type` but FastAPI expects `title`/`content`. (c) Supabase storage bucket doesn't exist.
**Fix:** Fix schema, fix build, create bucket.

### 10. North Indian Kundli Chart Topology Wrong
**Source:** UX (partial), Devil's Advocate (verified)
**Effort:** 2 hours
**Impact:** Houses 9-12 are placed inside the inner diamond at 0.25*half from center. In a real North Indian chart, all 12 houses occupy the triangular regions between the outer and inner diamonds. The chart will look wrong to anyone familiar with Vedic astrology.
**Fix:** Rewrite `housePositions` to match the traditional diamond layout.

---

## Issues Where Specialists Disagreed

### 1. Severity of `swe.set_sid_mode()` Global State
- **Architect:** High priority (H1). Concurrency bug risk.
- **Backend Engineer:** Acknowledged but noted GIL protection.
- **Devil's Advocate:** Purely theoretical. Cannot manifest under any realistic configuration. Footnote, not High priority.
- **Resolution:** Low priority. Only relevant if multi-threading is introduced.

### 2. Is BullMQ Necessary?
- **Backend Engineer:** Praised the retry logic and queue architecture.
- **Architect:** Accepted without question; focused on fixing the implementation.
- **Devil's Advocate:** Unnecessary complexity for a ~5 user app. Direct HTTP call to PDF endpoint would be simpler.
- **Resolution:** Keep for portfolio value, but deprioritize fixing the worker infrastructure until core features work.

### 3. Priority of Missing Dockerfiles
- **Architect:** Critical #1 -- the single biggest blocker.
- **Devil's Advocate:** Important for deployment, but premature to prioritize before the app works locally.
- **Resolution:** Tier 3 (production readiness), not Tier 1 (app functionality).

### 4. Significance of ts_rank Scale Mismatch in Hybrid Search
- **Database Expert:** High priority.
- **Devil's Advocate:** Minimal real-world impact for this domain. Text component contributes ~0.03 to scores vs ~0.6 from vectors.
- **Resolution:** Low-medium priority refinement.

### 5. Whether RLS Is "Correct"
- **Database Expert:** RLS correctly enabled on all tables.
- **Backend Engineer:** RLS is fragile without explicit auth checks.
- **Devil's Advocate:** RLS is technically correct but combined with missing auth middleware, creates silent failures.
- **Resolution:** RLS is correct but insufficient. Auth middleware is the real fix.

---

## Quick Wins (< 1 hour each)

| # | Fix | Effort | Impact | Source |
|---|-----|--------|--------|--------|
| 1 | Wire middleware.ts (one-line re-export) | 5 min | Enables auth on all routes | Arch C5 |
| 2 | Fix URL paths in astro-client.ts | 10 min | Unblocks transit API + alerts | Arch |
| 3 | Fix env var names across all files | 30 min | Unblocks ALL Supabase operations | Arch C2 |
| 4 | Fix mass-assignment (explicit field picks) | 30 min | Closes security vulnerabilities | Backend C2, C6 |
| 5 | Restrict FastAPI CORS to specific origins | 5 min | Closes CORS spec violation | Backend C7 |
| 6 | Fix "Generate Full Report" link | 15 min | Stops navigating to raw API | UX Critical #6 |
| 7 | Add Chart/Reports/Chat to sidebar | 15 min | Users can discover features | UX High #10 |
| 8 | Fix PDF schema (title/content vs report_id) | 15 min | Fixes PDF 422 errors | Arch C4 |
| 9 | Fix Dockerfile health check (httpx not requests) | 5 min | Container stops being "unhealthy" | Arch |
| 10 | Remove public port exposure for Redis + astro-engine | 5 min | Closes network security holes | Arch S1, S2 |
| 11 | Wrap SolarSystem3D in dynamic() with ssr:false | 15 min | Prevents SSR crash | UX Critical #1 |
| 12 | Fix Adhi Yoga threshold (>= 1 to >= 3) | 5 min | Eliminates most common false positive | Backend/DA |
| 13 | Remove duplicate Viparita Raja Yoga detection | 15 min | Stops duplicate yoga listings | DA |
| 14 | Add `updated_at` triggers (3 tables) | 15 min | Timestamps stop being stale | DB HIGH-1 |
| 15 | Replace Header bell icon with AlertBell component | 15 min | Uses already-built component | UX High #7 |
| 16 | Replace dashboard Link cards with ProfileCard | 30 min | Uses already-built component | UX High #8 |
| 17 | Fix report-worker env var (SUPABASE_SECRET_KEY to SERVICE_ROLE_KEY) | 2 min | Workers can authenticate | Backend H6 |
| 18 | Fix PDF bold/italic regex | 10 min | PDFs render markdown correctly | Backend H8 |

---

## What Should Be Done First

**Week 1: Make the app DO something**
1. Fix ChartData type mismatch (consolidate types)
2. Wire middleware.ts
3. Fix env var names
4. Fix mass-assignment vulnerabilities
5. Create chart/reports/chat page routes
6. Fix URL routing for transit endpoints
7. Fix "Generate Full Report" link and add sidebar nav items

**Week 2: Make core features work correctly**
1. Fix IST timezone hardcode
2. Fix yoga false positives
3. Replace ChatInterface mock with real SSE
4. Fix transit orb/is_exact calculations
5. Add SSE error handling (error events, status updates)
6. Fix North Indian chart topology

**Week 3: Production infrastructure**
1. Create Dockerfiles
2. Fix worker entry point and build
3. Fix PDF schema and create storage bucket
4. Add Zod validation
5. Add request timeouts
6. Restrict CORS, remove port exposure

---

## Final Word

Four specialists found ~150 individual issues. The Devil's Advocate traced them to root causes and found that most issues stem from three fundamental problems:

1. **Types don't match across the stack.** Python returns arrays; TypeScript expects objects. This one mismatch breaks reports, chat, and prompts.

2. **Components are built in isolation.** Beautiful visualization components exist in `components/` but no page route imports them. The app is a museum of unused code.

3. **Infrastructure was built before the app.** BullMQ workers, Redis queues, hybrid search functions, RAG pipelines -- all designed before the basic user flow works. The result is sophisticated plumbing connected to nothing.

The astro-engine calculation core (pyswisseph, dasha, nakshatra) is genuinely solid work. The report prompts are well-structured for Vedic astrology content. The RAG architecture is thoughtfully designed. But none of it connects into a working product. The project needs less engineering and more integration.
