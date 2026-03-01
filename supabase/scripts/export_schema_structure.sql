-- =============================================================================
-- Supabase / PostgreSQL: volledige schema-structuur als resultaat
-- Run in Supabase SQL Editor; je krijgt meerdere result sets (tabellen).
--
-- Zie ook: Supabase Snippet Complete schema inventory.csv (functie-inventaris).
-- =============================================================================

-- 1. SCHEMA'S
SELECT
  nspname AS schema_name,
  pg_catalog.pg_get_userbyid(nspowner) AS owner
FROM pg_catalog.pg_namespace
WHERE nspname NOT IN ('pg_catalog', 'pg_toast', 'information_schema')
  AND nspname NOT LIKE 'pg_temp%'
ORDER BY 1;

-- 2. TABELLEN + KOLOMMEN (type, nullable, default)
SELECT
  c.table_schema,
  c.table_name,
  c.column_name,
  c.ordinal_position,
  c.data_type,
  c.udt_name,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND c.table_schema NOT LIKE 'pg_%'
ORDER BY c.table_schema, c.table_name, c.ordinal_position;

-- 3. PRIMARY KEYS
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
GROUP BY tc.table_schema, tc.table_name, tc.constraint_name
ORDER BY 1, 2;

-- 4. FOREIGN KEYS (referenties)
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name AS column_name,
  ccu.table_schema AS ref_schema,
  ccu.table_name AS ref_table,
  ccu.column_name AS ref_column,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
  AND tc.table_schema = ccu.table_schema
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
  AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name, kcu.ordinal_position;

-- 5. UNIQUE CONSTRAINTS (excl. PK)
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
GROUP BY tc.table_schema, tc.table_name, tc.constraint_name
ORDER BY 1, 2;

-- 6. CHECK CONSTRAINTS
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
  AND tc.table_schema = cc.constraint_schema
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY 1, 2;

-- 7. INDEXEN (niet die van PK/UNIQUE als je alleen “extra” wilt, hier: alle)
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS definition
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND schemaname NOT LIKE 'pg_%'
ORDER BY schemaname, tablename, indexname;

-- 8. TRIGGERS
SELECT
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table AS table_name,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY trigger_schema, event_object_table, trigger_name;

-- 9. RULES (CREATE RULE) – overgeslagen: pg_rule is niet beschikbaar in Supabase
-- Gebruik eventueel lokaal: FROM pg_catalog.pg_rule

-- 10. VIEWS
SELECT
  table_schema,
  table_name AS view_name,
  view_definition
FROM information_schema.views
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND table_schema NOT LIKE 'pg_%'
ORDER BY 1, 2;

-- 11. RLS (Row Level Security) – per tabel
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND schemaname NOT LIKE 'pg_%'
  AND rowsecurity = true
ORDER BY 1, 2;

-- 12. RLS POLICIES (beleid)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY 1, 2, 3;

-- 13. ENUMS (custom types)
SELECT
  n.nspname AS schema_name,
  t.typname AS enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_labels
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE 'pg_%'
GROUP BY n.nspname, t.typname
ORDER BY 1, 2;

-- 14. FUNCTIONS (vergelijk met Supabase Snippet Complete schema inventory.csv)
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
  pg_catalog.pg_get_function_result(p.oid) AS return_type
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname NOT LIKE 'pg_%'
ORDER BY 1, 2;
