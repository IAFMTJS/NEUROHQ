-- Index audit for Supabase / Postgres (public schema)
-- Run in: Supabase Dashboard → SQL Editor
--
-- Use case: find exact duplicate definitions, heavy rarely-used indexes, and tables with many indexes.
-- Do NOT drop indexes without comparing pg_get_indexdef + verifying query plans / unique constraints.
--
-- 1) Exact duplicate index definitions (same CREATE INDEX text → safe to review; often copy-paste mistakes)
SELECT
  indexdef,
  count(*) AS duplicate_count,
  array_agg(indexname ORDER BY indexname) AS index_names
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY indexdef
HAVING count(*) > 1
ORDER BY duplicate_count DESC, indexdef;

-- 2) All indexes with size and scan count (idx_scan = 0 since stats reset can mean "unused" or "new")
--    pg_relation_size: disk for this index only
SELECT
  s.schemaname,
  s.relname AS table_name,
  s.indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size,
  s.idx_scan,
  s.idx_tup_read,
  s.idx_tup_fetch,
  i.indexdef
FROM pg_stat_user_indexes s
JOIN pg_indexes i
  ON i.schemaname = s.schemaname
 AND i.tablename = s.relname
 AND i.indexname = s.indexrelname
WHERE s.schemaname = 'public'
ORDER BY pg_relation_size(s.indexrelid) DESC;

-- 3) Tables with many secondary indexes (candidates for consolidation review; not automatically wrong)
SELECT
  c.relname AS table_name,
  count(*) FILTER (WHERE ix.indisprimary) AS primary_indexes,
  count(*) FILTER (WHERE NOT ix.indisprimary) AS secondary_indexes,
  pg_size_pretty(sum(pg_relation_size(i.oid))::bigint) AS total_index_size_on_table
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_index ix ON ix.indrelid = c.oid
JOIN pg_class i ON i.oid = ix.indexrelid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
GROUP BY c.relname
HAVING count(*) FILTER (WHERE NOT ix.indisprimary) >= 6
ORDER BY sum(pg_relation_size(i.oid)) DESC;

-- 4) Focus: tables that often have overlapping (user_id, date) style indexes in NeuroHQ
--    Adjust the list if needed.
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'daily_state',
    'budget_weekly_reviews',
    'recurring_budget_templates',
    'budget_entries',
    'tasks',
    'calendar_events',
    'push_sends_log'
  )
ORDER BY tablename, indexname;

-- After review, drops look like (example — replace names only after you confirmed redundancy):
-- DROP INDEX CONCURRENTLY IF EXISTS public.some_redundant_idx;
-- Note: CONCURRENTLY cannot run inside a transaction block in some clients; use SQL Editor "run" accordingly.
