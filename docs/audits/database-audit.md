# Database Audit -- JyotishAI

**Date:** 2026-02-24
**Persona:** Senior PostgreSQL/Supabase Database Expert
**Files Reviewed:** 22 files across schema docs, migrations, types, data access layer, API routes, workers, and pages

---

## Executive Summary

The JyotishAI database schema is well-designed for its purpose, with RLS enabled on all user-facing tables and a logical separation of concerns. However, the audit reveals **3 critical issues**, **7 high-priority issues**, and multiple medium/low improvements. The most severe problems are: (1) mass-assignment vulnerability in the profiles PATCH endpoint, (2) the alerts PATCH endpoint allowing arbitrary column updates from client input, and (3) the workers using `SUPABASE_SECRET_KEY` which bypasses all RLS, combined with a `select('*')` pattern that could leak data if any worker bug exists. The hybrid search function has a subtle scoring edge case and lacks a GIN tsvector index, which will cause full-table scans as `report_chunks` grows. There are no `updated_at` triggers anywhere in the schema, meaning those columns will permanently show creation time.

---

## Critical Issues (Must Fix)

### CRIT-1: Mass-Assignment Vulnerability in Profiles PATCH Endpoint

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\profiles\[id]\route.ts`, line 34

```typescript
const body = await request.json();
const { data: profile, error } = await supabase
  .from("profiles")
  .update(body)  // <-- entire request body passed directly
  .eq("id", id)
```

A malicious client can send `{ "user_id": "<another-user-uuid>" }` in the PATCH body and reassign a profile to another user. While RLS prevents reading other users' data, this could still cause data integrity issues -- a profile could become orphaned (belonging to a user_id that doesn't match the authenticated user), effectively making it invisible to its original owner but also inaccessible to the target user.

**Fix:** Explicitly pick allowed fields:
```typescript
const { name, birth_date, birth_time, birth_place, latitude, longitude,
        timezone, relation, avatar_url, notes } = body;
const updates = { name, birth_date, birth_time, birth_place, latitude,
                  longitude, timezone, relation, avatar_url, notes };
// Remove undefined keys
Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
```

### CRIT-2: Mass-Assignment Vulnerability in Alerts PATCH Endpoint

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\alerts\route.ts`, lines 26-38

```typescript
const { alertId, updates } = body;
const { data, error } = await supabase
  .from("transit_alerts")
  .update(updates)  // <-- arbitrary updates from client
  .eq("id", alertId)
```

Client can overwrite `profile_id`, `content`, `alert_type`, or any column. The intended use is likely just marking alerts as read (`is_read: true`). A client could modify `content` to inject misleading astrological predictions, or change `profile_id` to move alerts between profiles.

**Fix:** Whitelist the allowed update fields (likely just `is_read`):
```typescript
const { data, error } = await supabase
  .from("transit_alerts")
  .update({ is_read: updates.is_read ?? true })
  .eq("id", alertId)
```

### CRIT-3: Profiles POST Endpoint Allows Body to Override `user_id`

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\profiles\route.ts`, lines 30-33

```typescript
const { data: profile, error } = await supabase
  .from("profiles")
  .insert({
    user_id: user.user.id,
    ...body,   // <-- body spread AFTER user_id, so body.user_id wins
  })
```

Because the spread operator comes after `user_id`, a malicious request body containing `user_id` will override the authenticated user's ID. The RLS policy `auth.uid() = user_id` on INSERT means this will likely fail at the RLS level (Supabase checks the `USING` clause for `FOR ALL` policies on INSERT too via `WITH CHECK`), but this is defense-in-depth: the code should not rely solely on RLS for input validation.

**Fix:** Reverse the spread order or explicitly destructure:
```typescript
.insert({
  ...body,
  user_id: user.user.id,  // Always override with auth user
})
```

---

## High Priority Issues

### HIGH-1: No `updated_at` Trigger -- Timestamps Are Permanently Stale

**Tables affected:** `profiles`, `chat_sessions`, `user_preferences`

All three tables have `updated_at TIMESTAMPTZ DEFAULT NOW()`, but there is no trigger to automatically update this column on row modification. After creation, `updated_at` will always equal `created_at` regardless of how many times the row is updated.

**Impact:** The `chart_calculated_at` column on `profiles` might be set manually by the calculate endpoint, but `updated_at` on `profiles` and `user_preferences` will be misleading. Any UI showing "last updated" will show the wrong date.

**Fix:** Add a migration:
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### HIGH-2: No GIN tsvector Index on `report_chunks.content` -- Full-Text Search Will Full-Scan

**File:** `C:\Prabhat\Projects\JyotishAI\web\supabase\migrations\003_report_chunks.sql`

The hybrid search function calls `to_tsvector('english', rc.content)` on every row matched by `profile_id`. Without a stored tsvector column or a GIN index, PostgreSQL must compute `to_tsvector` for every row at query time. For a user with hundreds of report chunks, this will be slow.

**Fix:** Add a generated tsvector column with a GIN index:
```sql
ALTER TABLE report_chunks ADD COLUMN content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX idx_report_chunks_tsv ON report_chunks USING gin (content_tsv);
```
Then update `search_report_chunks` to use `rc.content_tsv` instead of `to_tsvector('english', rc.content)`.

### HIGH-3: Hybrid Search Scoring Edge Case -- `ts_rank` Can Dominate When Embeddings Are NULL

**File:** `C:\Prabhat\Projects\JyotishAI\web\supabase\migrations\007_hybrid_search_function.sql`

If a chunk has `embedding IS NULL` (e.g., embedding generation failed), the cosine distance `rc.embedding <=> p_query_embedding` returns NULL, making `similarity` NULL and `combined_score` NULL. NULL rows sink to the bottom with `ORDER BY combined_score DESC`, so they won't appear -- this is acceptable. However, the more subtle issue is:

- When all text-rank scores are 0 (no keyword overlap), the combined score is purely `0.7 * similarity`. This is fine.
- When similarity scores are very close (e.g., all between 0.82-0.85), the `ts_rank` component (0-based, no upper bound, but typically 0.0-0.1 for short content) can disproportionately influence ranking. A chunk with similarity 0.82 and ts_rank 0.08 scores `0.82*0.7 + 0.08*0.3 = 0.598`, while a chunk with similarity 0.85 and ts_rank 0.0 scores `0.85*0.7 = 0.595`. The keyword match flips the ranking despite lower semantic relevance.

**Recommendation:** Normalize ts_rank. One approach: divide each row's ts_rank by the maximum ts_rank in the result set. Or use `ts_rank_cd` which returns more consistent values. This is a refinement, not a bug, but will improve retrieval quality.

### HIGH-4: `report_chunks` Missing Composite Index for Common Query Pattern

The hybrid search function filters by `WHERE rc.profile_id = p_profile_id` and then sorts by combined_score. The HNSW index cannot be used when there is a pre-filter on `profile_id` -- PostgreSQL will use the `profile_id` B-tree index to filter first, then scan all matching rows for vector distance.

For large datasets, consider a **composite partial index** or restructure the query to use HNSW with a post-filter. At the current scale (family use), this is acceptable. At scale (thousands of chunks per profile), investigate `pgvector` partitioning by `profile_id`.

### HIGH-5: Workers Bypass RLS Entirely via Service Key

**Files:**
- `C:\Prabhat\Projects\JyotishAI\web\src\lib\workers\report-worker.ts`, line 15-17
- `C:\Prabhat\Projects\JyotishAI\web\src\lib\workers\alert-worker.ts`, line 15-17

```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
```

This is architecturally correct -- workers need service-role access to read/write across all profiles. However:

1. The env var is `SUPABASE_SECRET_KEY` but Supabase convention is `SUPABASE_SERVICE_ROLE_KEY`. This inconsistency could cause confusion.
2. The workers do `select('*')` when they only need specific columns (e.g., `report-worker` only needs `content` and `report_type` from `reports`).
3. There is no validation that `profileId` in the job data is a valid UUID, which could lead to confusing errors.

**Fix:** Rename to `SUPABASE_SERVICE_ROLE_KEY`, use specific column selects, add UUID validation.

### HIGH-6: Chat Route Does Not Verify Profile Ownership Before Creating Session

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\chat\route.ts`, lines 19-28

```typescript
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", profileId)
  .single();
```

This uses the server client with the user's auth context, so RLS protects the profile fetch. However, if `profileId` is for a profile the user doesn't own, the query returns null/error, and the API returns 404. This is correct behavior. **But**: the chat session creation at line 34 would fail at RLS level (can't insert into `chat_sessions` with a `profile_id` the user doesn't own), which would return a generic 500 error rather than a clear 403.

**Fix:** After the profile fetch, explicitly check ownership or let the RLS error surface as a 403.

### HIGH-7: TypeScript `ChartData` Type Mismatch Between `astro-client.ts` and `types/astro.ts`

**Files:**
- `C:\Prabhat\Projects\JyotishAI\web\src\lib\astro-client.ts`, line 66: `ChartData` uses `Record<string, Planet>` for `planets`
- `C:\Prabhat\Projects\JyotishAI\web\src\types\astro.ts`, line 95: `ChartData` uses `Planet[]` for `planets`

These are two different shapes. The `astro-client.ts` version matches the JSON structure in `DATABASE.md` (object keyed by planet name). The `types/astro.ts` version uses an array. Code in `chat.ts` (line 51) accesses `chartData.planets.Sun.sign` which requires the object/Record form from `astro-client.ts`.

Meanwhile, `profile/[id]/page.tsx` (lines 76, 108) casts `chart.planets` as `Array<{name, sign, ...}>`, which is the array form.

**Impact:** There are two incompatible `ChartData` types in the codebase. One will break at runtime depending on which shape the astro-engine actually returns.

---

## Schema Analysis

### profiles table

**Status:** Mostly sound.

| Aspect | Assessment |
|--------|-----------|
| Primary key | UUID, good |
| FK to auth.users | Correct, no ON DELETE CASCADE (intentional -- Supabase Auth manages user deletion) |
| Constraints | `relation` CHECK updated in migration 008 to include both capitalized and lowercase values -- **messy, should normalize to one casing** |
| `chart_data JSONB` | Appropriate for caching computed chart data; avoids schema rigidity for complex nested astrological data |
| `notes TEXT` | Added in migration 008, not reflected in `types.ts` -- **type mismatch** |
| `is_active` | Has a DEFAULT but no index -- if used for filtering, needs an index |
| Latitude/Longitude | DECIMAL(9,6) allows -999.999999 to 999.999999, but valid ranges are -90 to 90 (lat) and -180 to 180 (lng). **Missing CHECK constraints.** |

**Missing from types.ts:** The `notes` column added in migration 008 is not present in the TypeScript `Database` type definition.

### reports table

**Status:** Good.

| Aspect | Assessment |
|--------|-----------|
| CASCADE on profile_id | Correct -- deleting a profile deletes its reports |
| `generation_status` | TEXT with CHECK constraint, works but a real ENUM type would be more performant |
| `year` column | Nullable, used only for yearly reports. Consider a CHECK: `year IS NULL OR (year >= 1900 AND year <= 2100)` |
| Missing `updated_at` | No way to track when report status changed from 'generating' to 'complete' |
| Missing `error_message` | When `generation_status = 'failed'`, there's no column to store the error reason |

### report_chunks table (pgvector)

**Status:** Well-designed, needs performance tuning.

| Aspect | Assessment |
|--------|-----------|
| `embedding vector(1536)` | Correct for text-embedding-3-small |
| HNSW index | Correct `vector_cosine_ops` for cosine similarity |
| `chunk_index INTEGER` | Good, maintains ordering |
| Redundant `profile_id` | Denormalized from `reports.profile_id` for RLS performance -- **correct design choice** |
| Missing UNIQUE constraint | `(report_id, chunk_index)` should be UNIQUE to prevent duplicate chunks |
| Missing tsvector column | See HIGH-2 |

**HNSW vs IVFFlat:** At expected scale (family use, ~10-50 reports per profile, ~20-100 chunks per report), HNSW is the correct choice. IVFFlat requires tuning `nlist` and periodic re-clustering. HNSW provides better recall with acceptable build time at this scale.

### chat_sessions + chat_messages

**Status:** Sound.

| Aspect | Assessment |
|--------|-----------|
| CASCADE chain | chat_messages -> chat_sessions -> profiles. Deleting a profile cascades correctly. |
| RLS on chat_messages | Two-level subquery (session -> profile -> user). Correct but slow at scale. See RLS section. |
| Missing `is_deleted` soft-delete | Users can't delete individual messages. Consider adding. |
| `chat_sessions.updated_at` | Never actually updated (no trigger). See HIGH-1. |

### transit_alerts

**Status:** Good design, well-indexed.

| Aspect | Assessment |
|--------|-----------|
| Partial index on `is_read` | `WHERE is_read = false` -- excellent, covers the common "unread alerts" query |
| `trigger_date DATE` | Correct type for date-only astrological events |
| `orb DECIMAL(4,2)` | Allows -99.99 to 99.99; astronomical orbs are typically 0-15. Consider `CHECK (orb >= 0 AND orb <= 15)` |
| Missing composite index | `(profile_id, trigger_date)` -- the most common query pattern. Currently only individual indexes. |
| Missing composite index | `(profile_id, is_read)` for "unread alerts for a profile" |

### user_preferences

**Status:** Sound.

| Aspect | Assessment |
|--------|-----------|
| UNIQUE on user_id | Correct -- one preferences row per user |
| Missing CHECK constraints | `ayanamsha`, `house_system`, `dasha_system`, `chart_style`, `email_digest_day`, `default_language` all accept any TEXT. Should have CHECK constraints. |
| `whatsapp_number` | No format validation at DB level |
| `alert_orb DECIMAL(3,1)` | Allows -99.9 to 99.9; should be `CHECK (alert_orb > 0 AND alert_orb <= 15)` |

---

## RLS Security Analysis

### Overall Assessment: GOOD with caveats

All 6 user-facing tables have RLS enabled with `FOR ALL` policies. The pattern is consistent:
- `profiles`: Direct `auth.uid() = user_id`
- `reports`, `report_chunks`, `chat_sessions`, `transit_alerts`: Indirect via `profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())`
- `chat_messages`: Double-indirect via session_id -> chat_sessions -> profiles
- `user_preferences`: Direct `auth.uid() = user_id`

### Policy-by-Policy Analysis

**profiles -- "Users see own profiles"**
```sql
FOR ALL USING (auth.uid() = user_id)
```
- SELECT: Correct
- INSERT: The `USING` clause acts as `WITH CHECK` for `FOR ALL` policies. A user can only insert rows where `user_id = auth.uid()`. **Correct.**
- UPDATE: User can only update their own. **Correct.**
- DELETE: User can only delete their own. **Correct.**
- **Potential issue:** No separate `WITH CHECK` clause. For INSERT/UPDATE, Supabase uses the `USING` clause as the check. This means a user could theoretically UPDATE `user_id` to someone else's UUID (the USING clause checks the *new* row). **Wait -- actually, `USING` checks the *existing* row for UPDATE, and `WITH CHECK` checks the *new* row. Since there's no `WITH CHECK`, Supabase defaults to using `USING` as `WITH CHECK` too. So the new row must also satisfy `auth.uid() = user_id`.** This means a user CANNOT change their own profile's `user_id` to someone else's -- the update would fail RLS. **Safe.**

**reports -- "Users see own reports"**
```sql
FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
```
- This subquery runs with RLS on the `profiles` table too, creating a nested RLS check. Supabase handles this correctly; the subquery sees only the user's own profiles.
- **Performance:** This subquery executes for every row check. With an index on `profiles(user_id)`, it's a fast index lookup. **Acceptable.**
- **INSERT check:** When inserting a report, the `profile_id` must belong to a profile owned by the current user. **Correct.**

**report_chunks -- "Users see own chunks"**
```sql
FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
```
- Same pattern as reports. The denormalized `profile_id` means no join through `reports` is needed. **Good design choice** -- avoids a 3-table RLS chain.
- **But:** The worker inserts chunks using the service key, bypassing RLS. The API route `reports/generate/route.ts` uses the server client (with user cookies), so insertions go through RLS. Since the user created the report (and owns the profile), the `profile_id` check passes. **Correct.**

**chat_messages -- "Users see own messages"**
```sql
FOR ALL USING (
  session_id IN (
    SELECT id FROM chat_sessions WHERE profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
)
```
- **Two-level subquery.** This is correct but has a performance cost. Every row check requires:
  1. Index scan on `profiles(user_id)` to get profile IDs
  2. Index scan on `chat_sessions(profile_id)` to get session IDs
  3. Check if `session_id` is in the set
- At scale (hundreds of sessions, thousands of messages), this could become slow. Consider adding a denormalized `profile_id` column to `chat_messages` (like `report_chunks` does) to flatten the RLS check.

**transit_alerts -- "Users see own alerts"**
- Same pattern as reports. **Correct.**

**user_preferences -- "Users see own prefs"**
```sql
FOR ALL USING (auth.uid() = user_id)
```
- Direct ownership check. Combined with `UNIQUE(user_id)`, each user has exactly one row. **Correct.**

### RLS Bypass Risk Assessment

| Vector | Risk | Assessment |
|--------|------|-----------|
| Direct table access via PostgREST | None | RLS blocks all cross-user access |
| Join-based leak | None | Supabase's PostgREST respects RLS on joined tables |
| RPC function bypass | **Low risk** | `search_report_chunks` runs as the function definer. It filters by `p_profile_id` but does NOT verify that `p_profile_id` belongs to `auth.uid()`. However, since the RPC is called via the server client (with user cookies), and the function queries `report_chunks` which has RLS, the RLS still applies. **Safe**, but fragile -- if the function were changed to `SECURITY DEFINER`, it would bypass RLS. |
| Service key in workers | **Intentional** | Workers need cross-user access. Ensure service key is never exposed to client. |

---

## Index Analysis

### Coverage Assessment

| Table | Column(s) | Index Exists | Notes |
|-------|-----------|-------------|-------|
| profiles | user_id | Yes | `idx_profiles_user_id` |
| profiles | created_at | Yes (DESC) | `idx_profiles_created_at` |
| profiles | is_active | **No** | Add if used in filters |
| reports | profile_id | Yes | `idx_reports_profile_id` |
| reports | created_at | Yes (DESC) | |
| reports | report_type | Yes | `idx_reports_type` |
| reports | (profile_id, report_type) | **No** | Common query: "career reports for profile X" |
| reports | generation_status | **No** | Needed for worker polling |
| report_chunks | embedding (HNSW) | Yes | `vector_cosine_ops` correct |
| report_chunks | profile_id | Yes | |
| report_chunks | report_id | Yes | |
| report_chunks | metadata (GIN) | Yes | For JSONB queries |
| report_chunks | content tsvector | **No** | **HIGH-2** -- needed for full-text search |
| report_chunks | (report_id, chunk_index) | **No** | Should be UNIQUE constraint |
| chat_sessions | profile_id | Yes | |
| chat_messages | session_id | Yes | |
| chat_messages | created_at | Yes | |
| transit_alerts | profile_id | Yes | |
| transit_alerts | trigger_date | Yes | |
| transit_alerts | is_read (partial) | Yes | `WHERE is_read = false` |
| transit_alerts | alert_type | Yes | |
| transit_alerts | (profile_id, trigger_date) | **No** | **Recommended** composite |
| transit_alerts | (profile_id, is_read) | **No** | **Recommended** composite |
| user_preferences | user_id | Yes | Redundant with UNIQUE constraint (which creates an index) |

### HNSW Configuration

```sql
CREATE INDEX idx_report_chunks_embedding ON report_chunks
  USING hnsw (embedding vector_cosine_ops);
```

- **Dimension:** 1536 -- correct for `text-embedding-3-small`
- **Operator class:** `vector_cosine_ops` -- correct. Cosine distance is the standard choice for normalized OpenAI embeddings.
- **Default parameters:** `m=16, ef_construction=64`. At small scale, these are fine. For larger datasets (100K+ chunks), consider `m=32, ef_construction=128` for better recall.
- **Build time:** HNSW builds incrementally, so INSERT performance is constant. IVFFlat would require periodic `REINDEX`. **HNSW is the correct choice.**

---

## Hybrid Search Function Analysis

**File:** `C:\Prabhat\Projects\JyotishAI\web\supabase\migrations\007_hybrid_search_function.sql`

### Correctness

```sql
SELECT
    rc.id,
    rc.content,
    rc.metadata,
    rc.report_id,
    1 - (rc.embedding <=> p_query_embedding) AS similarity,
    ts_rank(...) AS ts_rank,
    (0.7 * (1 - (rc.embedding <=> p_query_embedding))) +
    (0.3 * ts_rank(...)) AS combined_score
FROM report_chunks rc
WHERE rc.profile_id = p_profile_id
ORDER BY combined_score DESC
LIMIT p_limit;
```

**Issues identified:**

1. **Column name collision:** The output column `ts_rank` has the same name as the PostgreSQL function `ts_rank()`. This works in PostgreSQL but is confusing and could cause issues in some query planning scenarios. Rename to `text_rank` or `fulltext_score`.

2. **No handling of NULL embeddings:** If `embedding IS NULL`, the cosine distance returns NULL, making `combined_score` NULL. These rows sort to the end with `ORDER BY DESC`. **Acceptable behavior** but should be documented.

3. **ts_rank scale mismatch:** `ts_rank` returns values typically in 0.0-0.1 range for short text, while `1 - cosine_distance` returns 0.0-1.0. The 0.7/0.3 weighting means:
   - Vector component contributes: `0.7 * [0.0 to 1.0]` = 0.0 to 0.7
   - Text component contributes: `0.3 * [0.0 to ~0.1]` = 0.0 to ~0.03
   - **The text component is effectively negligible.** The 0.3 weight would need to be much higher (e.g., 3.0) to meaningfully influence ranking, or `ts_rank` needs normalization.

4. **`to_tsvector` computed at query time:** Without a stored tsvector column, this is computed for every matching row. See HIGH-2.

5. **Language hardcoded to 'english':** Reports can be in Hindi (`language = 'hi'`). The `'english'` dictionary will perform poorly on Hindi text (no stemming, no stop words). Consider using `'simple'` dictionary for multilingual content, or dynamically selecting the dictionary based on report language.

6. **Missing `SECURITY INVOKER`:** The function defaults to `SECURITY INVOKER` (which is correct -- it runs with the caller's permissions, so RLS applies). This is the safe default. **No issue**, but worth explicitly stating for clarity.

### Retriever Integration

**File:** `C:\Prabhat\Projects\JyotishAI\web\src\lib\rag\retriever.ts`

```typescript
const { data, error } = await supabase.rpc("search_report_chunks", {
  p_profile_id: profileId,
  p_query_embedding: queryEmbedding,
  p_query_text: query,
  p_limit: limit,
});
```

- The `p_query_embedding` is passed as `number[]`. Supabase's PostgREST accepts arrays and converts to `vector` type. **Correct.**
- The `p_profile_id` comes from the API route which gets it from the request body (user input). Since the function runs with the caller's RLS context, a user can only search chunks for profiles they own. **Safe.**
- The `SearchResult` interface (line 8-15) is missing the `ts_rank` field that the function returns. Minor, but the type doesn't match the actual return shape.

---

## TypeScript Types Alignment

### `types.ts` vs `DATABASE.md`

| Column | Schema | types.ts | Match |
|--------|--------|----------|-------|
| profiles.notes | Added in migration 008 | **Missing** | MISMATCH |
| profiles.birth_date | DATE | string | OK (Supabase returns dates as ISO strings) |
| profiles.birth_time | TIME | string | OK |
| profiles.chart_data | JSONB | Json \| null | OK but untyped -- should use ChartData |
| report_chunks.embedding | vector(1536) | string \| null | OK (pgvector returns as string in PostgREST) |
| reports.generation_status | TEXT with CHECK | string \| null | **Should be union type** `'pending' \| 'generating' \| 'complete' \| 'failed'` |
| reports.report_type | TEXT with CHECK | string | **Should be union type** |
| chat_messages.role | TEXT with CHECK | string | **Should be union type** `'user' \| 'assistant'` |
| transit_alerts.alert_type | TEXT with CHECK | string | **Should be union type** |

### Two Conflicting `ChartData` Types

As noted in HIGH-7, there are two incompatible `ChartData` interfaces:

1. **`web/src/lib/astro-client.ts:66`** -- Uses `Record<string, Planet>` for `planets` (object keyed by planet name). Matches `DATABASE.md` JSON structure.
2. **`web/src/types/astro.ts:95`** -- Uses `Planet[]` for `planets` (array). Used by the profile page.

The `chat.ts` RAG module imports from `astro-client.ts` and accesses `chartData.planets.Sun.sign`. The profile page casts to `Array<{name, sign, ...}>`. **One of these will fail at runtime.**

### Recommendation

Consolidate to a single `ChartData` type in `types/astro.ts` that matches the actual JSON structure from the astro-engine. The profile page should adapt its rendering logic.

---

## Migration Files Analysis

### Migration Order

| # | File | Purpose | Dependencies | Correct Order |
|---|------|---------|-------------|---------------|
| 001 | profiles.sql | profiles table | auth.users | Yes |
| 002 | reports.sql | reports table | profiles | Yes |
| 003 | report_chunks.sql | pgvector + chunks | vector extension, reports, profiles | Yes |
| 004 | chat.sql | chat_sessions + messages | profiles | Yes |
| 005 | alerts.sql | transit_alerts | profiles | Yes |
| 006 | preferences.sql | user_preferences | auth.users | Yes |
| 007 | hybrid_search_function.sql | search function | report_chunks, vector | Yes |
| 008 | fix_profiles.sql | Add notes, fix relation CHECK | profiles | Yes |

**Order is correct.** The pgvector extension is created in migration 003 before the `report_chunks` table, which is the right dependency order.

### Completeness

All tables from `DATABASE.md` are covered in migrations. The hybrid search function is also included. **Complete.**

### Issues in Migrations

1. **Migration 008 -- Messy CHECK constraint:**
   ```sql
   CHECK (relation IN (
     'Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter',
     'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other',
     'self', 'spouse', 'parent', 'child', 'sibling', 'other'
   ))
   ```
   This allows both `'self'` and `'Self'`, `'Father'` and `'parent'`. It should normalize to one convention. The `types.ts` `relation` field is typed as `string | null` so it provides no guidance. Recommend: pick one set (e.g., lowercase) and add a migration to normalize existing data.

2. **No migration for `updated_at` triggers** -- See HIGH-1.

3. **No migration for Supabase Storage bucket creation** -- The `report-worker.ts` uploads to a `reports` bucket. This bucket must be created manually in the Supabase dashboard or via a migration/seed script. There's no documentation or automation for this.

---

## Query Pattern Analysis

### `select('*')` Usage

| File | Table | Concern |
|------|-------|---------|
| `api/v1/profiles/route.ts` (GET) | profiles | Returns `chart_data` JSONB which can be large (full chart). Dashboard only needs name, relation, birth_date, birth_place. **Overfetching.** |
| `api/v1/profiles/[id]/route.ts` (GET) | profiles | Acceptable -- profile detail page needs all fields |
| `api/v1/alerts/route.ts` (GET) | transit_alerts | Returns `content` (full alert text) for list view. Could be trimmed. |
| `profile/[id]/page.tsx` | profiles | Server component, acceptable |
| `dashboard/page.tsx` | profiles | Returns `chart_data` unnecessarily. **Overfetching.** |
| `report-worker.ts` | reports | Uses service key. Returns all columns but only needs `content` and `report_type`. |
| `alert-worker.ts` | profiles | Uses service key. Returns all columns but only needs `chart_data`. |

### Input Validation

| File | Issue |
|------|-------|
| `profiles/route.ts` POST | No validation of body fields. Missing fields rely on DB constraints. |
| `profiles/[id]/route.ts` PATCH | **CRIT-1** -- No field whitelist |
| `alerts/route.ts` PATCH | **CRIT-2** -- No field whitelist |
| `reports/generate/route.ts` | Validates `profileId` and `reportType` exist but not their format |
| `chat/route.ts` | Validates `profileId` and `message` exist but not their format |

### Supabase Client Usage

All API routes correctly use `createServerClient()` (SSR client with cookie-based auth). No API route uses the browser client. **Correct.**

The `createServerClient()` uses the **anon key** (via `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), which means all queries go through RLS. **Correct for user-facing endpoints.**

Workers correctly use `createClient()` with the service role key for background operations. **Correct.**

### Missing Auth Check in GET Endpoints

The `profiles/route.ts` GET handler and `alerts/route.ts` GET handler do not explicitly check `auth.getUser()`. They rely entirely on RLS to filter results. If the user is not authenticated, RLS will return zero rows (since `auth.uid()` is NULL). The middleware (`proxy.ts`) also checks auth and returns 401 for API routes. So there's a **double safety net**. However, explicitly checking auth provides clearer error messages.

---

## Data Integrity Analysis

### CASCADE Chain

```
auth.users
  |
  +-- profiles (no CASCADE -- manual cleanup needed when Supabase deletes a user)
       |
       +-- reports (CASCADE) --> report_chunks (CASCADE)
       +-- chat_sessions (CASCADE) --> chat_messages (CASCADE)
       +-- transit_alerts (CASCADE)
       +-- report_chunks (CASCADE, redundant path via reports too)

auth.users
  |
  +-- user_preferences (no CASCADE)
```

**Issue:** When a Supabase Auth user is deleted, the `profiles` and `user_preferences` rows are NOT automatically deleted (no `ON DELETE CASCADE` on the `auth.users` FK). This creates orphaned rows.

**Fix options:**
1. Add `ON DELETE CASCADE` to the FK: `user_id UUID REFERENCES auth.users ON DELETE CASCADE`
2. Use a Supabase Database Webhook on `auth.users` DELETE to clean up
3. Use a Supabase Edge Function triggered by the `user.deleted` Auth webhook

Option 1 is simplest. Add a migration:
```sql
ALTER TABLE profiles DROP CONSTRAINT profiles_user_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_user_id_fkey;
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### Orphaned Chunks

If report generation fails mid-way through chunk insertion (e.g., embedding API timeout after some chunks are inserted), there will be partial chunk sets for a report. The report will have `generation_status = 'generating'` permanently.

**Fix:** Wrap chunk insertion in a transaction (the Supabase client doesn't support multi-statement transactions via PostgREST). Use a PostgreSQL function or the service-role client with raw SQL. Alternatively, add a cleanup job that deletes chunks for failed reports.

### `chart_calculated_at` Staleness

The `chart_calculated_at` column exists to track when chart data was last computed. However, there's no code that checks this for cache invalidation. If a user updates their birth time (via PATCH), the `chart_data` becomes stale but is still served. The profile page should check `chart_calculated_at` vs `updated_at` and prompt recalculation.

---

## Supabase-Specific Issues

### Realtime Subscriptions

No realtime subscriptions are used anywhere in the codebase. Consider enabling Supabase Realtime on `transit_alerts` for the in-app notification bell -- new alerts would appear without polling.

### Supabase Storage

The `report-worker.ts` uploads PDFs to a `reports` bucket. There is no documentation or migration for:
1. Creating the bucket
2. Setting bucket as public vs private
3. RLS policies on the storage bucket
4. File size limits

The worker uses `getPublicUrl()`, implying the bucket is public. If reports contain sensitive astrological data, the PDF should be in a private bucket with signed URLs instead.

### Auth + RLS Edge Cases

1. **Token expiry during long requests:** The `reports/generate/route.ts` handler streams responses that could run for minutes. If the Supabase JWT expires mid-stream, the final `saveReportContent` call (which runs after streaming completes) could fail because the auth context is stale. The middleware refreshes tokens, but the initial auth context captured by `createServerClient()` won't be refreshed during the stream.

   **Mitigation:** The `saveReportContent` function uses the same `supabase` instance created at the start of the request. If the JWT was valid at request start and the stream takes <60 minutes (typical JWT lifetime), this is fine. For very long reports, consider using the service role for the post-stream save.

2. **`auth.uid()` in RLS functions:** In Supabase, `auth.uid()` reads from the JWT in the request headers. If a user is deleted from `auth.users` while they have an active session, their JWT is still valid until expiry. During this window, RLS policies using `auth.uid()` will still match, but FKs to `auth.users` may cause constraint violations on INSERT.

---

## Quick Wins

1. **Add `notes` to `types.ts`** -- 1 line change, fixes a type mismatch from migration 008.

2. **Reverse spread order in profiles POST** -- Change `{ user_id, ...body }` to `{ ...body, user_id }`. 1 line fix for CRIT-3.

3. **Whitelist fields in PATCH endpoints** -- 5-10 lines each for CRIT-1 and CRIT-2.

4. **Add union types for constrained columns** -- Replace `string` with `'pending' | 'generating' | 'complete' | 'failed'` for `generation_status`, etc. Improves type safety with zero runtime cost.

5. **Add `error_message` column to reports** -- Useful for debugging failed generations.

6. **Reduce `select('*')` to specific columns in dashboard** -- Replace `select('*')` with `select('id, name, relation, birth_date, birth_place, created_at')` in the dashboard query. Saves bandwidth by not transferring `chart_data` JSONB.

7. **Add composite index `(profile_id, trigger_date)` on transit_alerts** -- One CREATE INDEX statement, significant query improvement.

8. **Rename `SUPABASE_SECRET_KEY` to `SUPABASE_SERVICE_ROLE_KEY`** -- Follows Supabase convention.

---

## Recommendations Summary

| # | Priority | Issue | Effort |
|---|----------|-------|--------|
| CRIT-1 | Critical | Mass-assignment in profiles PATCH | Low (10 min) |
| CRIT-2 | Critical | Mass-assignment in alerts PATCH | Low (10 min) |
| CRIT-3 | Critical | user_id override in profiles POST | Low (5 min) |
| HIGH-1 | High | No updated_at triggers | Low (15 min migration) |
| HIGH-2 | High | Missing tsvector index for full-text search | Medium (migration + function update) |
| HIGH-3 | High | Hybrid search scoring imbalance | Medium (function rewrite) |
| HIGH-4 | High | Missing composite index for vector pre-filter | Low (1 index) |
| HIGH-5 | High | Worker env var naming + select optimization | Low (30 min) |
| HIGH-6 | High | Chat route error handling for unauthorized profiles | Low (15 min) |
| HIGH-7 | High | Dual ChartData types causing runtime confusion | Medium (type consolidation) |
| MED-1 | Medium | Orphaned rows on auth.users deletion | Low (migration) |
| MED-2 | Medium | Missing lat/lng CHECK constraints | Low (migration) |
| MED-3 | Medium | Normalize relation CHECK values | Low (migration) |
| MED-4 | Medium | Hindi text in English tsvector config | Medium (function update) |
| MED-5 | Medium | Storage bucket not documented/automated | Low (docs) |
| MED-6 | Medium | Missing UNIQUE on (report_id, chunk_index) | Low (migration) |
| MED-7 | Medium | `notes` column missing from types.ts | Low (1 line) |
| LOW-1 | Low | Add error_message to reports table | Low (migration) |
| LOW-2 | Low | Reduce select('*') to specific columns | Low (per query) |
| LOW-3 | Low | Consider Realtime for transit_alerts | Medium (new feature) |
| LOW-4 | Low | Private storage bucket for sensitive PDFs | Medium (config change) |

---

## Appendix: Files Reviewed

| File | Path |
|------|------|
| Schema doc | `C:\Prabhat\Projects\JyotishAI\docs\DATABASE.md` |
| Migration 001 | `C:\Prabhat\Projects\JyotishAI\web\supabase\migrations\001_profiles.sql` |
| Migration 002 | `C:\Prabhat\Projects\JyotishAI\web\supabase\migrations\002_reports.sql` |
| Migration 003 | `C:\Prabhat\Projects\JyotishAI\web\supabase\migrations\003_report_chunks.sql` |
| Migration 004 | `C:\Prabhat\Projects\JyotishAI\web\supabase\migrations\004_chat.sql` |
| Migration 005 | `C:\Prabhat\Projects\JyotishAI\web\supabase\migrations\005_alerts.sql` |
| Migration 006 | `C:\Prabhat\Projects\JyotishAI\web\supabase\migrations\006_preferences.sql` |
| Migration 007 | `C:\Prabhat\Projects\JyotishAI\web\supabase\migrations\007_hybrid_search_function.sql` |
| Migration 008 | `C:\Prabhat\Projects\JyotishAI\web\supabase\migrations\008_fix_profiles.sql` |
| TypeScript types | `C:\Prabhat\Projects\JyotishAI\web\src\lib\supabase\types.ts` |
| Browser client | `C:\Prabhat\Projects\JyotishAI\web\src\lib\supabase\client.ts` |
| Server client | `C:\Prabhat\Projects\JyotishAI\web\src\lib\supabase\server.ts` |
| RAG retriever | `C:\Prabhat\Projects\JyotishAI\web\src\lib\rag\retriever.ts` |
| RAG embedder | `C:\Prabhat\Projects\JyotishAI\web\src\lib\rag\embedder.ts` |
| RAG chunker | `C:\Prabhat\Projects\JyotishAI\web\src\lib\rag\chunker.ts` |
| RAG chat | `C:\Prabhat\Projects\JyotishAI\web\src\lib\rag\chat.ts` |
| Profiles API | `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\profiles\route.ts` |
| Profiles [id] API | `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\profiles\[id]\route.ts` |
| Reports generate API | `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\reports\generate\route.ts` |
| Chat API | `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\chat\route.ts` |
| Alerts API | `C:\Prabhat\Projects\JyotishAI\web\src\app\api\v1\alerts\route.ts` |
| Dashboard page | `C:\Prabhat\Projects\JyotishAI\web\src\app\(main)\dashboard\page.tsx` |
| Profile page | `C:\Prabhat\Projects\JyotishAI\web\src\app\(main)\profile\[id]\page.tsx` |
| Report worker | `C:\Prabhat\Projects\JyotishAI\web\src\lib\workers\report-worker.ts` |
| Alert worker | `C:\Prabhat\Projects\JyotishAI\web\src\lib\workers\alert-worker.ts` |
| Proxy/middleware | `C:\Prabhat\Projects\JyotishAI\web\src\proxy.ts` |
| Astro client types | `C:\Prabhat\Projects\JyotishAI\web\src\lib\astro-client.ts` |
| Astro types | `C:\Prabhat\Projects\JyotishAI\web\src\types\astro.ts` |
