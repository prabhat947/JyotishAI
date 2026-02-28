# Architecture Audit -- JyotishAI

**Date:** 2026-02-24
**Persona:** Staff Technical Architect
**Scope:** Full-stack architecture review covering Docker, service communication, worker lifecycle, observability, security, and scalability.

---

## Executive Summary

JyotishAI has a well-structured conceptual architecture: a Next.js 15 BFF fronting a FastAPI calculation microservice, with BullMQ workers for async PDF and alert generation, Supabase for persistence/auth, and OpenRouter for LLM access. The separation of concerns between the web layer (UI + orchestration) and the astro-engine (pure computation) is sound.

However, the implementation has **several critical gaps** that will prevent a reliable production deployment. The most severe issues are:

1. **Missing `web/Dockerfile` and `Dockerfile.worker`** -- the docker-compose.yml references files that do not exist.
2. **Environment variable name mismatch** -- workers reference `SUPABASE_SECRET_KEY` but the .env.example defines `SUPABASE_SERVICE_ROLE_KEY`. The Supabase client code references `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` but the .env.example defines `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Hardcoded UTC offset (IST 5.5)** in the astro-engine -- the `timezone` field from `BirthData` is ignored, making calculations incorrect for non-IST births.
4. **No middleware.ts** -- the auth guard logic in `proxy.ts` is never wired into Next.js, leaving all API routes unprotected.
5. **PDF generation request schema mismatch** between the worker's `generatePDF()` call and the astro-engine's expected `ReportRequest` model.
6. **No request timeouts** on any inter-service HTTP calls.

These issues are fixable in a focused sprint, but they must be addressed before any production deployment.

---

## System Architecture Assessment

### Overall Design: Solid

The three-tier architecture is appropriate for this system:

```
Browser --> Next.js BFF (API routes) --> astro-engine (FastAPI)
                |                             |
                +-- Supabase (data + auth)    +-- pyswisseph (calculations)
                +-- OpenRouter (LLM)          +-- ReportLab (PDF)
                +-- BullMQ/Redis (queues)
```

**What works well:**
- astro-engine is correctly isolated as a stateless computation service. It has no database dependency, no auth concern, no LLM dependency. This is clean service boundary design.
- The BFF pattern is correctly applied: Next.js API routes handle auth, orchestration, and data persistence while delegating heavy computation to the Python microservice.
- RAG architecture (chunker -> embedder -> pgvector -> hybrid search) is well designed with proper separation of indexing and retrieval.
- Supabase RLS policies provide defense-in-depth at the database level.

**What needs work:**
- The worker architecture has a process lifecycle problem (detailed below).
- Several wiring issues between planned architecture and actual code.
- Observability is nearly zero.

---

## Critical Issues (Must Fix Before Production)

### C1: Missing Dockerfiles for web and worker

**docker-compose.yml** (lines 5-7, 37-38) references:
- `./web/Dockerfile` -- does not exist
- `./web/Dockerfile.worker` -- does not exist

Only `astro-engine/Dockerfile` exists. Without these, `docker-compose up` will fail immediately.

**Impact:** Cannot deploy. This is the single biggest blocker.

**Fix:**
- Create `web/Dockerfile` (multi-stage Node.js build: install deps, build Next.js, run with `next start`).
- Create `web/Dockerfile.worker` (similar base, but CMD runs the worker entrypoint instead of Next.js).
- Alternatively, use a single Dockerfile with different CMD overrides in docker-compose.

---

### C2: Environment Variable Name Mismatches

Three separate naming inconsistencies:

**a) Supabase service key:**
- `.env.example` (line 4): `SUPABASE_SERVICE_ROLE_KEY`
- `web/src/lib/workers/report-worker.ts` (line 17): `process.env.SUPABASE_SECRET_KEY!`
- `web/src/lib/workers/alert-worker.ts` (line 17): `process.env.SUPABASE_SECRET_KEY!`

Workers will initialize Supabase client with `undefined`, causing silent auth failures on every job.

**b) Supabase anon/publishable key:**
- `.env.example` (line 3): `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `web/src/lib/supabase/server.ts` (line 10): `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!`
- `web/src/lib/supabase/client.ts` (line 7): `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!`
- `web/src/proxy.ts` (line 11): `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!`

All Supabase client instantiations will get `undefined` as the key if using the `.env.example` naming.

**Impact:** Every Supabase operation (auth, data reads, data writes) silently breaks. Workers will crash on every job.

**Fix:** Standardize on one name per key. Recommended: use `NEXT_PUBLIC_SUPABASE_ANON_KEY` (matches Supabase docs) and `SUPABASE_SERVICE_ROLE_KEY` (matches Supabase docs). Update all code references.

---

### C3: Hardcoded IST UTC Offset in astro-engine

In `astro-engine/routers/chart.py` (line 35):
```python
utc_offset = 5.5
jd = calculator.calc_julian_day(birth_datetime, utc_offset)
```

Same in `astro-engine/routers/dasha.py` (line 35).

The `BirthData` schema (in `astro-engine/schemas/birth_data.py`, line 13) has a `timezone` field (`"Asia/Kolkata"` default), but it is **never read** by the chart calculation endpoint. The UTC offset is always hardcoded to 5.5 hours.

**Impact:** Any birth chart calculated for a non-IST timezone (UTC, EST, GMT, etc.) will produce incorrect planetary positions, incorrect lagna, incorrect dasha balance, and incorrect yogas. This is a calculation accuracy bug, which is the core value proposition of the system.

**Fix:** Parse the timezone string from `birth_data.timezone` using `pytz` or `zoneinfo` (Python 3.9+), compute the actual UTC offset for the given birth date/time, and pass that to `calc_julian_day()`. Add `pytz` or use stdlib `zoneinfo` to requirements.txt.

---

### C4: PDF Generation Schema Mismatch

The worker calls `generatePDF()` in `astro-client.ts` (line 164-168):
```typescript
body: JSON.stringify({ report_id: reportId, content, report_type: reportType })
```

But the astro-engine's PDF endpoint (`astro-engine/routers/pdf.py`, lines 16-22) expects:
```python
class ReportRequest(BaseModel):
    title: str
    content: str
    author: str = "JyotishAI"
    subject: str = "Vedic Astrology Report"
```

The fields do not match:
- Worker sends: `report_id`, `content`, `report_type`
- API expects: `title`, `content`, `author`, `subject`

**Impact:** Every PDF generation job will return a 422 Validation Error from FastAPI. PDF generation is completely broken.

**Fix:** Either update the worker's `generatePDF()` to send `title`, `content`, `author`, `subject` or update the Pydantic model to accept `report_id` + `report_type` and derive the title internally.

---

### C5: Auth Middleware Not Wired

`web/src/proxy.ts` contains auth guard logic (redirect unauthenticated users, return 401 for API routes), but:
- There is **no `middleware.ts`** file at `web/src/middleware.ts` (Glob confirmed: no files found).
- Next.js middleware must be exported from `src/middleware.ts` (or `middleware.ts` at project root).
- The function in `proxy.ts` is named `proxy` and exported along with a `config`, but Next.js middleware requires the default export to be named `middleware`.

**Impact:** All API routes are completely unprotected. Any unauthenticated HTTP request to `/api/v1/reports/generate`, `/api/v1/calculate`, etc. will succeed. Supabase RLS provides a second layer, but the `createServerClient()` in API routes uses the anon key with cookies -- if there are no cookies, the RLS will deny access, but the server still wastes compute calling astro-engine and OpenRouter before the Supabase write fails.

**Fix:** Create `web/src/middleware.ts` that imports and re-exports from `proxy.ts`:
```typescript
export { proxy as middleware, config } from './proxy';
```

---

### C6: No Request Timeouts on Inter-Service Calls

`web/src/lib/astro-client.ts` uses bare `fetch()` with no timeout configuration:
```typescript
const response = await fetch(`${ASTRO_ENGINE_URL}/chart`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(birthData),
});
```

No `AbortController`, no `signal`, no timeout. Same pattern in `report-generator.ts`, `embedder.ts`, `rag/chat.ts`.

**Impact:** If astro-engine hangs (e.g., pyswisseph deadlock on corrupt ephemeris data), the Next.js API route will hang indefinitely, consuming a serverless function slot. If OpenRouter has a network issue, the SSE stream will hang forever. Under load, this can exhaust all available connections.

**Fix:** Add `AbortController` with reasonable timeouts:
- astro-engine chart calculation: 30 seconds
- OpenRouter LLM streaming: 120 seconds (reports are long)
- Embedding API: 30 seconds
- PDF generation: 60 seconds

---

## High Priority Issues

### H1: `swe.set_sid_mode()` Is Called at Module Load, Globally

In `astro-engine/core/calculator.py` (line 11):
```python
swe.set_sid_mode(swe.SIDM_LAHIRI)
```

This is module-level state. Swiss Ephemeris is a C library with global state -- `set_sid_mode` affects all subsequent `calc_ut` calls process-wide. If the system ever supports multiple ayanamsha options (Lahiri, KP, Raman -- as specified in `FEATURES.md` F7.1), concurrent requests with different ayanamsha settings will corrupt each other's results.

**Impact:** Currently safe (only Lahiri), but will become a concurrency bug when multi-ayanamsha support is added.

**Fix:** Either (a) set the sidereal mode per-request before each calculation call and use a threading lock, or (b) accept that the engine only supports one ayanamsha at a time and document this as a known limitation.

---

### H2: Worker Process Lifecycle in Docker

`docker-compose.yml` (line 48) runs the worker as:
```yaml
command: node dist/workers/index.js
```

But:
- There is no `dist/` directory build step defined. The worker files are TypeScript (`.ts`), not compiled JavaScript.
- `package.json` defines worker scripts as `tsx watch src/lib/workers/report-worker.ts` -- using `tsx` (TypeScript executor), not a compiled `dist/` bundle.
- There is no build step that would produce `dist/workers/index.js`.
- There is no `src/lib/workers/index.ts` that combines report-worker and alert-worker.

**Impact:** Worker container will crash immediately with `MODULE_NOT_FOUND`.

**Fix:**
- Create a `web/src/lib/workers/index.ts` that imports both workers.
- Add a build script that compiles workers to `dist/`.
- Or change the docker command to use `tsx` instead of `node dist/`.

---

### H3: alert-worker References `applying` Field That astro-engine Never Returns

In `web/src/lib/workers/alert-worker.ts` (line 47):
```typescript
const significantAspects = aspects.filter(
  (aspect) => Math.abs(aspect.orb) < 2.0 && aspect.applying
);
```

But the `AspectData` interface in `astro-client.ts` (line 103) defines `applying: boolean`, while the astro-engine's `TransitAspect` schema (`chart.py`, line 266) returns `is_exact` -- not `applying`. The astro-engine never computes whether an aspect is applying or separating.

**Impact:** `aspect.applying` will always be `undefined` (falsy), so the filter will return zero results. No alerts will ever be generated.

**Fix:** Either add an `applying` field to the astro-engine's `TransitAspect` model (computed from transit planet speed relative to natal position) or remove the `applying` filter from the alert worker.

---

### H4: BullMQ Redis Connection Duplication

Redis connections are created independently in three places:
1. `web/src/lib/workers/queue.ts` (line 9) -- one IORedis instance
2. `web/src/lib/workers/report-worker.ts` (line 11) -- another IORedis instance
3. `web/src/lib/workers/alert-worker.ts` (line 11) -- yet another IORedis instance

Each creates its own `new IORedis(...)` connection. BullMQ also creates additional connections internally (subscriber, event listener).

**Impact:** Excessive Redis connections. Upstash free tier limits concurrent connections to 100. With 3 base connections + BullMQ internals, each running process consumes ~6-8 connections. If the web app also imports `queue.ts` for enqueuing, that adds more. Under multiple deployments or restarts, connection leaks can hit the Upstash limit.

**Fix:** Create a shared Redis connection factory in a single module. Export the connection instance and reuse it across queue producers and workers.

---

## Docker & Deployment Analysis

### docker-compose.yml Assessment

**Positive aspects:**
- Correct service dependency ordering (`depends_on`)
- Redis data persistence via named volume (`redis_data`)
- Redis AOF persistence enabled (`--appendonly yes`)
- Environment variable injection from `env_file` (not hardcoded)
- Internal Docker network connectivity (services can reach each other by name)

**Issues:**

| Line | Issue | Severity |
|------|-------|----------|
| 6-7 | `web/Dockerfile` does not exist | Critical |
| 38 | `web/Dockerfile.worker` does not exist | Critical |
| 11 | `NODE_ENV=development` -- should be `production` for deployment | Medium |
| 29 | `ports: "8000:8000"` -- astro-engine is exposed to host/internet | High (security) |
| 53 | `ports: "6379:6379"` -- Redis is exposed to host/internet | High (security) |
| 20-22 | Source code volume mounts (`./web:/app`) -- dev-only, breaks production builds | Medium |
| 31 | astro-engine volume mount (`./astro-engine:/app`) -- dev-only pattern | Medium |
| 48 | `node dist/workers/index.js` -- file does not exist | Critical |
| 33 | `NODE_ENV=production` for worker but `development` for web -- inconsistent | Low |

**Missing:**
- No `web/Dockerfile` (critical)
- No `Dockerfile.worker` (critical)
- No health checks for web, worker, or Redis services (only astro-engine has one)
- No restart policy (`restart: unless-stopped` or `restart: on-failure`)
- No resource limits (`deploy.resources.limits`)
- No logging driver configuration
- No `networks:` definition (uses default, which is fine, but explicit is better)

### astro-engine Dockerfile Assessment

**Positive aspects:**
- Uses slim base image (good for size)
- Installs gcc/g++ for native compilation (needed by pyswisseph)
- Creates `ephe/` directory for Swiss Ephemeris data
- Has a health check

**Issues:**

| Line | Issue | Severity |
|------|-------|----------|
| 23 | `mkdir -p /app/ephe` creates empty directory -- no ephemeris files are copied or downloaded | High |
| 29 | Health check uses `python -c "import requests; ..."` but `requests` is not in requirements.txt | Critical |
| 33 | Runs uvicorn without `--workers` flag -- single worker, no concurrency | Medium |

The health check will fail on every invocation because `import requests` will raise `ModuleNotFoundError`. The Dockerfile HEALTHCHECK will mark the container as unhealthy continuously.

**Fix for line 29:** Either add `requests` to requirements.txt, or use `httpx` (which is already a dependency):
```dockerfile
HEALTHCHECK CMD python -c "import httpx; httpx.get('http://localhost:8000/health')"
```

**Fix for line 23:** Either COPY ephemeris files into the image or add a startup script that downloads them. Without `.se1` files, pyswisseph will use built-in Moshier calculations which are less accurate for dates far from J2000. For a portfolio project this may be acceptable, but it contradicts the stated accuracy target of "+/-1 arcminute".

---

## Service Communication Analysis

### Next.js to astro-engine

Communication is via `web/src/lib/astro-client.ts`, which is a clean typed HTTP client.

**Positive:**
- Type-safe interfaces (`BirthData`, `ChartData`, `Planet`, `House`, etc.)
- Single `ASTRO_ENGINE_URL` configuration point
- Error handling with meaningful error messages

**Issues:**
- No timeouts (Critical C6, covered above)
- No retry logic for transient failures
- No circuit breaker pattern
- No request/response logging
- `ASTRO_ENGINE_URL` defaults to `http://localhost:8000` -- correct for dev, but in Docker it should be `http://astro-engine:8000`. The docker-compose sets `ASTRO_ENGINE_URL=http://astro-engine:8000` as an environment variable for the web service, which is correct. But the worker service (line 42) also sets it correctly. This is properly handled.

### URL Routing Mismatch

The `astro-client.ts` calls:
- `GET ${ASTRO_ENGINE_URL}/transits` (line 127)

But in `astro-engine/routers/chart.py`, the transits endpoint is:
- `GET /chart/transits` (line 171, because the router has `prefix="/chart"`)

So the actual URL is `/chart/transits`, not `/transits`. The client will get a 404.

Similarly:
- Client calls `POST /transits/natal` (line 143) -- actual endpoint is `POST /chart/transits/natal`
- Client calls `POST /pdf/report` (line 164) -- this one is correct (pdf router has `prefix="/pdf"`)
- Client calls `POST /chart` (line 110) -- the chart router uses `prefix="/chart"` and the endpoint is `@router.post("")`, so the actual URL is `POST /chart`. This one is correct.

**Impact:** Transit endpoints and alert worker will fail with 404 errors.

**Fix:** Update `astro-client.ts` to use `/chart/transits` and `/chart/transits/natal`.

---

## Worker Architecture Analysis

### Process Model

The intended architecture has workers running as separate Docker containers (correct approach). BullMQ workers are long-running Node.js processes that poll Redis for jobs -- they **cannot** run inside Next.js serverless functions.

**Current state:**
- Workers are separate TypeScript files: `report-worker.ts` and `alert-worker.ts`
- `docker-compose.yml` defines a separate `worker` service (correct)
- `package.json` has separate scripts: `npm run worker` and `npm run alert-worker`

**Problems:**
1. Docker command references nonexistent `dist/workers/index.js`
2. No combined entry point for both workers
3. No graceful shutdown handling (no `SIGTERM` handler)
4. No dead-letter queue (DLQ) configuration for permanently failed jobs
5. Alert worker has no scheduler -- jobs must be manually enqueued. There is no cron-like mechanism to run the daily alert generation described in `FEATURES.md` F5.5.

### Job Failure Handling

`queue.ts` configures retry with exponential backoff:
```typescript
attempts: 3,
backoff: { type: "exponential", delay: 2000 }
```

This is reasonable. However:
- No `removeOnComplete` / `removeOnFail` settings -- completed/failed jobs accumulate in Redis indefinitely
- No job TTL or cleanup
- With Upstash free tier (256MB), completed job data will eventually fill Redis

### Worker to Supabase Authentication

Workers use `createClient()` with the service role key (bypasses RLS). This is the correct pattern for background workers. However, the env var name mismatch (C2) means this will fail at runtime.

---

## Observability Gaps

### Logging

- **astro-engine:** No structured logging. Uses FastAPI default (uvicorn access logs only). No request ID, no timing, no calculation metadata.
- **Next.js web:** No logging framework. Uses `console.log` / `console.error` in a few places.
- **Workers:** `console.log` only (`report-worker.ts` lines 23, 67; `alert-worker.ts` lines 22, 67).
- **No log aggregation setup.** In Docker, logs go to stdout/stderr (correct for containers), but there is no log driver configured in docker-compose.

### Error Tracking

- No Sentry, no Bugsnag, no error tracking of any kind.
- astro-engine catches all exceptions and returns generic 500 errors (`chart.py` line 167). The `str(e)` is returned to the client, which can leak internal Python stack traces.

### Health Checks

- **astro-engine:** Has `/health` endpoint (returns `{"status": "healthy"}`). Simple but functional.
- **Next.js web:** No `/api/health` endpoint exists (Glob confirmed: no health files found).
- **Workers:** No health check mechanism. No way to know if workers are alive and processing.
- **Redis:** No health check in docker-compose.

### Metrics

- No Prometheus metrics, no StatsD, no custom metrics.
- No visibility into:
  - Report generation queue depth
  - Average report generation time
  - astro-engine calculation latency
  - LLM token usage
  - Worker job success/failure rates

### Recommendation

At minimum, add:
1. A `/api/health` route in Next.js that checks Redis connectivity and astro-engine reachability.
2. Structured JSON logging (e.g., `pino` for Node.js, `structlog` for Python).
3. Request ID propagation between Next.js and astro-engine.
4. Basic Sentry integration for both web and astro-engine.

---

## Security Infrastructure Issues

### S1: astro-engine Exposed to Public Internet

`docker-compose.yml` (line 29): `ports: "8000:8000"` maps the container port to the host. If Dokploy/Hostinger exposes all host ports, the astro-engine API (including `/docs` -- the Swagger UI) is publicly accessible.

**Fix:** Remove the port mapping. In Docker Compose, services on the same network can communicate by service name without port mapping. Only expose the web service (port 3000) to the host:
```yaml
astro-engine:
  # Remove: ports: "8000:8000"
  expose:
    - "8000"  # Internal only
```

### S2: Redis Exposed to Public Internet

`docker-compose.yml` (line 53): `ports: "6379:6379"` with no authentication.

**Impact:** Anyone can connect to Redis and read/write queue data, flush all data, or use it as a crypto-mining relay.

**Fix:** Remove port mapping. Add Redis password:
```yaml
redis:
  command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
```

### S3: CORS Wildcard on astro-engine

`astro-engine/main.py` (line 19):
```python
allow_origins=["*"]
```

With the comment "In production, restrict to specific origins." Since astro-engine should only be called from the Next.js service within the Docker network, CORS is not even needed (CORS is a browser-level concern, not a server-to-server concern). But if it stays, restrict to the web service origin.

### S4: Swagger UI Enabled in Production

`astro-engine/main.py` (lines 13-14):
```python
docs_url="/docs",
redoc_url="/redoc"
```

Combined with S1, this exposes full API documentation publicly.

**Fix:** Disable in production:
```python
docs_url="/docs" if os.getenv("ENV") != "production" else None
```

### S5: Missing Rate Limiting

No rate limiting on any endpoint. The LLM-consuming endpoints (`/api/v1/reports/generate`, `/api/v1/chat`) are expensive (OpenRouter API costs). A malicious or buggy client could rack up significant API bills.

---

## Scalability Assessment

### Report Generation Bottleneck

Report generation involves:
1. Fetch chart data from Supabase (~50ms)
2. Build prompt (~1ms)
3. Stream from OpenRouter (30-120 seconds for a full report)
4. Collect full text, save to Supabase (~100ms)
5. Chunk text + generate embeddings via OpenRouter (~5-10 seconds for batch)
6. Enqueue PDF generation

Steps 3-5 are performed **inside the SSE response handler** (`reports/generate/route.ts`, lines 65-108). This means the API route holds a connection open for the entire duration of LLM generation + post-processing.

**Concern:** Next.js API routes in Node.js can handle concurrent connections, but each report generation holds a connection for 30-120+ seconds. With default Node.js limits and a single process, you might handle ~50-100 concurrent report generations before hitting backpressure.

**More critically:** The embedding step (line 141 in `route.ts`) happens after the stream completes but before sending `[DONE]` to the client. If embedding fails (OpenRouter rate limit, network timeout), the client never receives `[DONE]`, and the report content may not be saved.

**Fix:** Decouple post-stream operations. After the LLM stream completes, immediately send `[DONE]` to the client. Then save the content and enqueue embedding/PDF generation as separate BullMQ jobs. This also prevents the user from waiting for embeddings to complete.

### Chart Data Caching

Chart data is cached in `profiles.chart_data` (JSONB column). This is effective -- once calculated, the chart never changes (birth data is immutable). The `chart_calculated_at` timestamp in the database schema allows cache invalidation if the calculation engine is updated.

**Assessment:** This caching strategy is correct and sufficient. No additional caching layer needed.

### astro-engine Concurrency

The Dockerfile runs uvicorn with a single worker:
```
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

For CPU-bound pyswisseph calculations, multiple workers would help. Add `--workers 2` (or scale based on available CPU cores). Note: with multiple workers, the global `swe.set_sid_mode()` state issue (H1) becomes more complex -- each worker process has its own Python interpreter, so this is actually fine for multi-process (not multi-thread) concurrency.

---

## Missing Infrastructure

### M1: No `web/Dockerfile`

Required for any Docker-based deployment. Must build Next.js and serve with `next start`.

### M2: No `web/Dockerfile.worker`

Required for running BullMQ workers in Docker.

### M3: No Combined Worker Entry Point

Need `web/src/lib/workers/index.ts` that initializes both report and alert workers.

### M4: No Supabase Migration Runner

Migrations exist in `web/supabase/migrations/` (001 through 008), but there is no documentation on how to apply them. No `supabase` CLI configuration. No migration README.

### M5: No `.env.production` Template

`.env.example` exists but uses localhost URLs. A `.env.production` template should show Docker-internal URLs:
```
ASTRO_ENGINE_URL=http://astro-engine:8000
REDIS_URL=redis://redis:6379
```

### M6: No Startup/Init Script

No script that:
- Applies Supabase migrations
- Creates Supabase storage buckets
- Downloads ephemeris data
- Validates environment variables
- Runs a smoke test

### M7: No `middleware.ts` (covered in C5)

### M8: No Alert Scheduler

The alert system (`FEATURES.md` F5.5) describes a daily midnight cron job, but there is no BullMQ repeatable job configuration, no node-cron, and no external scheduler.

### M9: No `web/src/app/api/health/route.ts`

No health check endpoint for the Next.js service.

### M10: No Graceful Shutdown in Workers

Workers do not handle `SIGTERM`. When Docker stops the worker container, in-flight jobs may be lost. BullMQ provides `worker.close()` for graceful shutdown.

---

## Quick Wins

These are low-effort, high-impact fixes:

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | Standardize env var names (`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) across all files | 30 min | Fixes all Supabase operations |
| 2 | Fix astro-client.ts URL paths (`/chart/transits`, `/chart/transits/natal`) | 10 min | Fixes transit API + alerts |
| 3 | Fix PDF request schema in `generatePDF()` to send `title` instead of `report_id` | 15 min | Fixes PDF generation |
| 4 | Create `web/src/middleware.ts` re-exporting from `proxy.ts` | 5 min | Enables auth protection |
| 5 | Fix health check in astro-engine Dockerfile (use `httpx` instead of `requests`) | 5 min | Fixes Docker health check |
| 6 | Remove port mappings for astro-engine and Redis in docker-compose | 5 min | Closes security holes |
| 7 | Add `restart: unless-stopped` to all services in docker-compose | 5 min | Auto-recovery from crashes |
| 8 | Parse timezone from `birth_data.timezone` instead of hardcoding IST | 1 hour | Fixes all non-IST calculations |
| 9 | Add `AbortController` timeouts to `astro-client.ts` and `report-generator.ts` | 30 min | Prevents hung connections |
| 10 | Create basic `/api/health` route in Next.js | 15 min | Enables health monitoring |

---

## Recommendations Summary

### Immediate (Before any deployment)
1. **Create `web/Dockerfile` and `web/Dockerfile.worker`** (C1)
2. **Fix all environment variable name mismatches** (C2)
3. **Fix timezone hardcode in astro-engine** (C3)
4. **Fix PDF schema mismatch** (C4)
5. **Create `middleware.ts`** (C5)
6. **Fix URL paths in astro-client.ts** (transit endpoints)
7. **Fix astro-engine Dockerfile health check** (use httpx)
8. **Remove public port exposure for astro-engine and Redis** (S1, S2)

### Short-term (First sprint after deployment)
9. Add request timeouts to all inter-service HTTP calls (C6)
10. Create combined worker entry point with graceful shutdown
11. Add structured logging (pino for Node.js, structlog for Python)
12. Add Sentry error tracking
13. Create `/api/health` endpoint in Next.js
14. Add BullMQ repeatable job for daily alert generation
15. Decouple embedding from the SSE response handler
16. Add `restart: unless-stopped` to all Docker services
17. Add multi-worker uvicorn configuration for astro-engine

### Medium-term (As usage grows)
18. Add Redis authentication
19. Add rate limiting on LLM-consuming endpoints
20. Add Prometheus metrics for queue depth, latency, error rates
21. Implement circuit breaker pattern in astro-client
22. Add job cleanup/TTL configuration in BullMQ
23. Consider shared Redis connection factory
24. Disable Swagger UI in production
25. Add `.env.production` template

### Architecture Evolution (If scaling beyond family use)
26. Consider moving embedding to a worker (not inline in API route)
27. Consider Redis Cluster or managed Redis (beyond Upstash free tier)
28. Consider separating PDF generation into its own microservice
29. Add CDN for generated PDFs (currently in Supabase Storage, which is fine for low traffic)

---

## Appendix: Files Reviewed

| File | Path | Key Observations |
|------|------|------------------|
| docker-compose.yml | `./docker-compose.yml` | References missing Dockerfiles; exposes internal services |
| Dockerfile (astro-engine) | `./astro-engine/Dockerfile` | Broken health check; empty ephe dir |
| main.py | `./astro-engine/main.py` | Wildcard CORS; Swagger exposed |
| calculator.py | `./astro-engine/core/calculator.py` | Global swe state; solid calculation logic |
| chart.py | `./astro-engine/routers/chart.py` | Hardcoded IST; transit endpoints under /chart prefix |
| pdf.py | `./astro-engine/routers/pdf.py` | Schema mismatch with worker |
| next.config.ts | `./web/next.config.ts` | Minimal; only Supabase image config |
| package.json | `./web/package.json` | Dev port 3001 vs compose port 3000 |
| astro-client.ts | `./web/src/lib/astro-client.ts` | No timeouts; wrong transit URLs |
| queue.ts | `./web/src/lib/workers/queue.ts` | Duplicate Redis connections |
| report-worker.ts | `./web/src/lib/workers/report-worker.ts` | Wrong env var name for Supabase key |
| alert-worker.ts | `./web/src/lib/workers/alert-worker.ts` | Wrong env var; references nonexistent `applying` field |
| route.ts (calculate) | `./web/src/app/api/v1/calculate/route.ts` | Clean; no auth check (relies on middleware) |
| route.ts (reports) | `./web/src/app/api/v1/reports/generate/route.ts` | Embedding inline in SSE handler |
| report-generator.ts | `./web/src/lib/report-generator.ts` | Clean OpenRouter streaming |
| proxy.ts | `./web/src/proxy.ts` | Auth logic exists but never wired |
| server.ts (supabase) | `./web/src/lib/supabase/server.ts` | Wrong env var name |
| embedder.ts | `./web/src/lib/rag/embedder.ts` | No error retry; no timeout |
| chunker.ts | `./web/src/lib/rag/chunker.ts` | Token estimation is approximate but acceptable |
| retriever.ts | `./web/src/lib/rag/retriever.ts` | Hybrid search well implemented |
| chat.ts | `./web/src/lib/rag/chat.ts` | Clean RAG chat with context building |
| .env.example | `./.env.example` | Different key names than code expects |
| ARCHITECTURE.md | `./docs/ARCHITECTURE.md` | Good documentation; matches intended design |
| DATABASE.md | `./docs/DATABASE.md` | Thorough schema with RLS; hybrid search function |
| FEATURES.md | `./docs/FEATURES.md` | Comprehensive feature spec |
| requirements.txt | `./astro-engine/requirements.txt` | Missing `requests` (used in health check) |
