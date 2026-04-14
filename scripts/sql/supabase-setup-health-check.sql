-- Supabase / Postgres health snapshot for NEUROHQ (run in SQL Editor on the target project)
-- Use after migrations; interpret results with DEPLOY.md and RLS intent (some tables are service_role-only).

-- A) Base tables in public without RLS (usually should be fixed unless intentionally service_role-only via no policies + RLS off is wrong; RLS off = table bypasses RLS for roles that don't bypass)
SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
ORDER BY 1;

-- B) RLS enabled but no policies (often breaks anon/authenticated access or means only superuser/service_role)
SELECT n.nspname AS schema_name,
       c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity
  AND NOT EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = n.nspname
      AND p.tablename = c.relname
  )
ORDER BY 1, 2;

-- C) Policy count per table (spot tables with only admin or overly broad policies)
SELECT schemaname, tablename, count(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY policy_count DESC, tablename;

-- D) Views in public (check security_invoker vs definer in migrations)
SELECT table_schema, table_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- E) Large tables + total relation size (plan retention / archiving)
SELECT relname AS table_name,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
       pg_size_pretty(pg_relation_size(c.oid)) AS table_only,
       (SELECT pg_size_pretty(sum(pg_relation_size(i.indexrelid)))
        FROM pg_index i
        WHERE i.indrelid = c.oid) AS indexes_approx
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 40;

-- F) Index usage: never-scanned indexes since stats reset (candidates to drop after verifying with EXPLAIN)
SELECT s.schemaname,
       s.relname AS table_name,
       s.indexrelname AS index_name,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size,
       s.idx_scan
FROM pg_stat_user_indexes s
WHERE s.schemaname = 'public'
  AND s.idx_scan = 0
  AND s.indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(s.indexrelid) DESC;
