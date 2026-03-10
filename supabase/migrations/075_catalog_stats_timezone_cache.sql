-- Optional: improve planner stats for catalog-heavy queries (pg_proc, pg_type, etc.).
-- Supabase/PostgREST still run their own introspection; this only helps when those run.
ANALYZE pg_proc;
ANALYZE pg_type;
ANALYZE pg_namespace;
ANALYZE pg_language;

-- (1) Slow: select name from pg_timezone_names
-- Cached timezone list for your own SQL/app. Use this instead of pg_timezone_names;
-- Supabase internal pg_timezone_names calls are unchanged.
CREATE MATERIALIZED VIEW IF NOT EXISTS public.cached_timezone_names AS
  SELECT name FROM pg_timezone_names;

CREATE UNIQUE INDEX IF NOT EXISTS cached_timezone_names_name_idx
  ON public.cached_timezone_names (name);

COMMENT ON MATERIALIZED VIEW public.cached_timezone_names IS
  'Cached copy of pg_timezone_names. Refresh with REFRESH MATERIALIZED VIEW public.cached_timezone_names. Use from app to avoid hitting pg_timezone_names; Supabase internal queries are unaffected.';

-- (2) Slow: big CTE over pg_proc (function introspection)
-- Simplified cache of callable functions so your own code can list RPCs without
-- running the heavy introspection. PostgREST/Dashboard still run their own query;
-- use this for custom admin tools, dashboards, or scripts.
CREATE MATERIALIZED VIEW IF NOT EXISTS public.cached_rpc_functions AS
  SELECT
    p.oid AS id,
    n.nspname AS schema_name,
    p.proname AS name,
    pg_get_function_arguments(p.oid) AS argument_types,
    pg_get_function_result(p.oid) AS return_type,
    pg_get_function_identity_arguments(p.oid) AS identity_argument_types
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind = 'f'
    AND n.nspname NOT IN ('pg_catalog', 'pg_toast', 'information_schema');

CREATE UNIQUE INDEX IF NOT EXISTS cached_rpc_functions_id_idx
  ON public.cached_rpc_functions (id);

COMMENT ON MATERIALIZED VIEW public.cached_rpc_functions IS
  'Cached list of callable functions (prokind=f). Refresh after schema changes: REFRESH MATERIALIZED VIEW CONCURRENTLY public.cached_rpc_functions. PostgREST still runs its own introspection; use this from custom tools to avoid the heavy pg_proc CTE.';

-- (3) Slow: many set_config('search_path', ...), set_config('request.jwt.claims', ...), etc.
-- Cannot be optimized with SQL. Those run in PostgREST on every API request.
-- Mitigations: use Connection pooling (Session mode, port 6543) and reduce number of
-- separate API requests per page load.
