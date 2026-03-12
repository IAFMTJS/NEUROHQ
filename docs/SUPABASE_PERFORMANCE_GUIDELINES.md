> Single-page checklist for writing fast, safe Supabase code in NEUROHQ.

# Supabase performance guidelines (NEUROHQ)

Use this when you add **any new Supabase query, RPC, or table**, or when you touch dashboard/tasks/budget/assistant code.

---

## 1. Queries: shape and volume

- **1.1 Never `select *` on real tables**
  - Always request **only the columns you actually need** (including joins).
  - OK to `select *` only on:
    - **Small static reference tables** (a few rows, a few columns), or
    - **Views/materialized views** that are already skinny and curated for the use case.

- **1.2 Avoid client-side joins**
  - If you find yourself:
    - Fetching table A, then table B, then joining in JS/TS, **stop**.
  - Instead:
    - Use a single **RPC** or **SQL view** that does the join in Postgres, or
    - Use a single Supabase query with embedded relations where appropriate.

- **1.3 Minimise round-trips per page**
  - Prefer **one “payload” action** that assembles what a page needs (e.g. `getDashboardPayload`) instead of many scattered calls.
  - Reuse existing actions where possible instead of creating parallel ones that hit the same tables again.

---

## 2. Indexing and filters

- **2.1 Index anything filtered frequently**
  - If a column (or column pair) appears in:
    - `where` clauses,
    - `order by` on big tables, or
    - `range` filters on hot paths (dashboard, tasks, budget, assistant),
    then it should usually have an **index**.
  - Examples already covered in `NEUROHQ_DATABASE_SCHEMA.md`:
    - `tasks(user_id, due_date)`, `tasks(user_id, due_date, completed)`
    - `budget_entries(user_id, date)`
    - `learning_sessions(user_id, date)`
    - `user_analytics_daily(user_id, date)`
  - When in doubt: check **Supabase Query Performance** and follow the **index advisor**; encode good indexes as migrations so they’re versioned.

- **2.2 Be careful with “index everything”**
  - Don’t add indexes on:
    - Columns that are almost never filtered,
    - Extremely low-cardinality booleans on their own (e.g. `completed` without `user_id` / date),
    - Columns that change constantly, unless they’re critical for performance.
  - Every index makes **writes a bit slower**; prefer **targeted**, query-driven indexes.

---

## 3. Caching and aggregates

- **3.1 Cache hot rows server-side**
  - Things like **user profile**, **preferences**, and **“today” state** are read extremely often and change infrequently.
  - Use:
    - **Server-side caches** (React Query, in-memory per process, edge cache) where safe, and
    - Clear or refetch on mutation (e.g. after updating preferences or daily_state).

- **3.2 Store aggregates instead of recalculating**
  - For dashboards/analytics:
    - Use dedicated tables like `user_analytics_daily` (already in schema) to store **daily/weekly aggregates**.
    - Avoid repeatedly scanning large `tasks`, `task_events`, `behaviour_log`, or `budget_entries` tables to compute the same totals on every request.

- **3.3 Use materialized views for heavy analytics or catalog queries**
  - For expensive joins/aggregations that power analytics or admin views, prefer **materialized views**:
    - Refresh them on a schedule (e.g. daily or hourly) or after key migrations.
    - Query the view instead of hitting base tables every time.
  - See `SUPABASE_SLOW_QUERIES.md` for examples (`cached_timezone_names`, `cached_rpc_functions`).

- **3.4 Avoid repeated `count()` on large tables**
  - Don’t call `count()` in a tight loop or on every page view if the number is mostly for **display**.
  - Prefer:
    - Precomputed counts in aggregate tables, or
    - Approximate counts where exact accuracy is not critical.

---

## 4. Supabase realtime and subscriptions

- **4.1 Use realtime only when it truly adds value**
  - Good fits:
    - Live-updating dashboards where staleness is painful,
    - Collaborative scenarios where others’ changes must show up immediately.
  - Not good fits:
    - Rarely changing data,
    - Analytics/metrics,
    - Anything that can tolerate a short delay and be fetched via polling or on navigation.

- **4.2 Never subscribe to entire large tables**
  - Always:
    - Filter subscriptions by `user_id` and by **narrow conditions** (e.g. only today’s tasks, or only the current user’s budget entries).
  - Avoid:
    - “Catch-all” subscriptions on `public.tasks` or similar without filters.

---

## 5. Connection management and auth

- **5.1 Use Supabase connection pooling for direct DB usage**
  - For anything using a **Postgres connection string** (migrations, scripts, other services), use the **pooler** (Session mode, port `6543`) – see `SUPABASE_SLOW_QUERIES.md`.

- **5.2 Reuse Supabase clients**
  - In server code and scripts, **reuse one Supabase client per process** or per request context (as already done in `@/lib/supabase/server`).
  - Don’t create a new client for every small function call.

- **5.3 Avoid redundant auth checks**
  - Let **RLS** do the heavy lifting.
  - Don’t bolt on repeated “who is this user?” queries ahead of every Supabase call if:
    - The user is already known from the session, or
    - The same information is cached in the current request/context.

---

## 6. How to use this checklist

- When adding a new query or modifying an action:
  - **Check columns:** are you selecting only what you need?
  - **Check joins:** is the join happening in Postgres (SQL/RPC) instead of in JS?
  - **Check indexes:** will this query be fast with existing indexes? If not, add a migration for a targeted index.
  - **Check caching:** is this data read very often? Should it be cached or pre-aggregated?
  - **Check realtime:** do you really need subscriptions here, and are they tightly scoped?

If the answer to any of these is “no” or “not sure”, pause and fix it before shipping. This keeps Supabase fast and avoids accidental self-DDoS as data and traffic grow.

