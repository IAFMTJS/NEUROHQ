-- Supabase egress analysis helper (DB-side approximation)
-- Run in Supabase SQL Editor on production.
--
-- PROBLEEM: "Run" op het hele bestand met meerdere SELECTs → vaak alleen het LAATSTE resultaat
-- (bijv. alleen stats_reset). Oplossing: onderstaande ENKELE query uitvoeren (alles eronder staat
-- in commentaar voor copy/paste per stuk indien je losse tabellen wilt).

-- ========== RUN DEZE QUERY ALLEEN (één result grid) ==========
WITH
db AS (
  SELECT oid AS db_oid FROM pg_database WHERE datname = current_database()
),
top_statements AS (
  SELECT
    left(query, 200) AS query_sample,
    calls,
    round(total_exec_time::numeric, 2) AS total_exec_ms,
    round(mean_exec_time::numeric, 2) AS mean_exec_ms,
    s.rows AS total_rows_returned
  FROM pg_stat_statements s
  CROSS JOIN db
  WHERE s.dbid = db.db_oid
  ORDER BY s.total_exec_time DESC
  LIMIT 15
),
top_tables_scans AS (
  SELECT
    relname AS table_name,
    seq_scan,
    idx_scan,
    n_live_tup
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY (seq_scan + idx_scan) DESC, n_live_tup DESC
  LIMIT 15
),
top_tables_size AS (
  SELECT
    c.relname AS table_name,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
    pg_total_relation_size(c.oid) AS total_size_bytes
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
  ORDER BY pg_total_relation_size(c.oid) DESC
  LIMIT 15
)
SELECT
  (SELECT stats_reset FROM pg_stat_database WHERE datname = current_database()) AS stats_reset,
  (SELECT extversion FROM pg_extension WHERE extname = 'pg_stat_statements' LIMIT 1) AS pg_stat_statements_version,
  (SELECT count(*) FROM pg_stat_statements s CROSS JOIN db WHERE s.dbid = db.db_oid) AS tracked_statements_this_db,
  (SELECT jsonb_pretty(jsonb_agg(to_jsonb(t) ORDER BY t.total_exec_ms DESC)) FROM top_statements t) AS top_statements_by_total_time_json,
  (SELECT jsonb_pretty(jsonb_agg(to_jsonb(t) ORDER BY (t.seq_scan + t.idx_scan) DESC)) FROM top_tables_scans t) AS top_public_tables_by_scans_json,
  (SELECT jsonb_pretty(jsonb_agg(to_jsonb(t) ORDER BY t.total_size_bytes DESC)) FROM top_tables_size t) AS top_public_tables_by_size_json;

-- ========== Hieronder: losse queries (één blok tegelijk selecteren en runnen) ==========
/*
-- 0) Extensie + aantal statements
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'pg_stat_statements';

SELECT count(*) AS pg_stat_statements_rows
FROM pg_stat_statements;

-- 1) Top pg_stat_statements by total execution time (hot queries).
SELECT
  left(query, 220) AS query_sample,
  calls,
  round(total_exec_time::numeric, 2) AS total_exec_ms,
  round(mean_exec_time::numeric, 2) AS mean_exec_ms,
  rows AS total_rows_returned
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
ORDER BY total_exec_time DESC
LIMIT 50;

-- 2) Candidate "egress-heavy" queries:
SELECT
  left(query, 220) AS query_sample,
  calls,
  rows,
  round((rows::numeric / nullif(calls, 0)), 2) AS rows_per_call,
  round(mean_exec_time::numeric, 2) AS mean_exec_ms
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  AND calls >= 5
ORDER BY rows_per_call DESC, rows DESC
LIMIT 50;

-- 3) Table-level IO pressure
SELECT
  schemaname,
  relname AS table_name,
  seq_scan,
  idx_scan,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY (seq_scan + idx_scan) DESC, n_live_tup DESC
LIMIT 50;

-- 4) Big tables by on-disk size
SELECT
  c.relname AS table_name,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  pg_size_pretty(pg_relation_size(c.oid)) AS heap_size,
  pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) AS indexes_toast_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY pg_total_relation_size(c.oid) DESC
LIMIT 40;

-- 5) Index hit ratio proxy
SELECT
  s.relname AS table_name,
  s.seq_scan,
  s.idx_scan,
  CASE
    WHEN (s.seq_scan + s.idx_scan) = 0 THEN null
    ELSE round((s.idx_scan::numeric / (s.seq_scan + s.idx_scan)) * 100, 2)
  END AS idx_scan_pct
FROM pg_stat_user_tables s
WHERE s.schemaname = 'public'
ORDER BY idx_scan_pct NULLS LAST, (s.seq_scan + s.idx_scan) DESC
LIMIT 50;

-- 6) stats_reset only
SELECT stats_reset
FROM pg_stat_database
WHERE datname = current_database();
*/
