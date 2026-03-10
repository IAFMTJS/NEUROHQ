# Supabase slow queries (what they are and what to do)

If you see slow queries in **Supabase Dashboard → Reports / Query performance** like:

- `select name from pg_timezone_names`
- A large CTE over `pg_proc` (function introspection)
- Many `select set_config('search_path', ...)` (and similar) in one request

they are **issued by Supabase’s own stack** (PostgREST, Dashboard, client libraries), not by NEUROHQ app code. The app only uses the Supabase **HTTP API** (`NEXT_PUBLIC_SUPABASE_URL` + anon/service key); it does not open direct Postgres connections.

**From a typical report:** `pg_timezone_names` can be ~26% of total time (118 calls, mean ~604 ms, cache hit 0). The pg_proc CTE ~19% (256 calls, mean ~199 ms). The set_config chain ~10.6% but with **506k calls** (mean ~0.06 ms each)—reducing request count and using the pooler matters most there.

---

## What you should do

| Action | Where / how |
|--------|-------------|
| **Use the pooler for any direct DB usage** | If you use a **Postgres connection string** anywhere (migrations, CLI, another service): in **Supabase Dashboard → Project Settings → Database**, use the **Connection pooling** URI (Session mode, port **6543**), not the direct connection (5432). |
| **Don’t leave heavy Dashboard tabs open** | **Database → Functions** runs the heavy `pg_proc` introspection. Open it only when needed; use SQL Editor for quick checks. |
| **Reuse one Supabase client per process** | The app already uses `createClient()` from `@/lib/supabase/server` (cached per request). If you add other backends or scripts, reuse a single client instead of creating one per call. |
| **Batch migrations** | Fewer, batched schema changes reduce PostgREST schema cache invalidation and repeated introspection. |
| **Upgrade plan if needed** | On Free tier, catalog-heavy queries are more noticeable; upgrading can help. |
| **Contact Supabase** | If these queries dominate and you’re on a paid plan, open a support ticket and point to these patterns; they can suggest project-level tuning. |

There is **no code change in this repo** that will make those internal Supabase queries faster; the levers are Dashboard usage, connection pooling for direct DB access, and Supabase-side configuration/support.

---

## Optional: SQL script (covers all 3 slow-query patterns)

Run the migration **once** in Supabase SQL Editor (or apply via `supabase db push`):

- **File:** `supabase/migrations/075_catalog_stats_timezone_cache.sql`

It addresses all three:

| Slow query | What the script does |
|------------|------------------------|
| **(1)** `select name from pg_timezone_names` | **`public.cached_timezone_names`** – materialized view. Use `SELECT name FROM public.cached_timezone_names` in your own SQL/app instead of `pg_timezone_names`. Supabase’s internal calls are unchanged. |
| **(2)** Big CTE over `pg_proc` (function introspection) | **`public.cached_rpc_functions`** – materialized view with schema, name, argument_types, return_type. Use it from custom admin tools or scripts to list callable functions without running the heavy CTE. PostgREST/Dashboard still run their own introspection. |
| **(3)** Many `set_config('search_path', ...)` etc. | **No SQL fix.** Those run in PostgREST on every request. Use **Connection pooling** (Session mode, port 6543) and fewer API requests per page. |

The script also runs **`ANALYZE`** on `pg_proc`, `pg_type`, `pg_namespace`, `pg_language` so the planner has fresh stats when catalog queries do run.

**Refresh the caches** when needed (e.g. after migrations or Postgres upgrade):

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY public.cached_timezone_names;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.cached_rpc_functions;
```

You can re-run the `ANALYZE` lines periodically (e.g. after many migrations) to keep catalog stats fresh.

---

## Index from Supabase advisor

If the report’s **index_advisor_result** suggests an index (e.g. on `public.tasks (completed_at)`), apply it. Migration **`076_tasks_completed_at_index.sql`** adds that index for the “completed tasks in date range” query pattern.
