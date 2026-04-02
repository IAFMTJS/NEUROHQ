-- -----------------------------------------------------------------------------
-- All users: total XP and derived level (matches app logic in lib/xp.ts)
--
-- WHY TWO SOURCES OF "USERS"?
--   The original version joined from auth.users only. That HIDES:
--     - Rows in public.user_xp whose user still exists in public.users but no
--       longer has an auth.users row (deleted account, or sync edge cases).
--     - public.users profiles that never got a matching auth row (rare).
--   The PRIMARY query below unions public.users.id and auth.users.id so every
--   app identity and every auth identity appears at least once.
--
-- STORAGE — canonical vs historical (do not mix up):
--   - public.user_xp.total_xp  → source of truth for current total (app: getXP)
--   - public.user_xp.updated_at → last write to that total
--   Level is NOT stored; derived in app via levelFromTotalXP() in lib/xp.ts.
--
-- Other XP-related tables (older paths / by-date / partial logs):
--   - public.xp_events (amount, created_at, source_type) — append-only log when
--     addXP() passes source_type; NOT all XP changes are logged; SUM(amount)
--     often != user_xp.total_xp (deductions, learning path, older code).
--   - public.user_analytics_daily.xp_earned — per calendar date; sum over days
--     is not guaranteed to equal user_xp.total_xp.
--   - public.behaviour_log.xp_gained — DCIC / missions completion history.
--   - public.pending_xp_notifications.total_xp — one-shot UI payload; deleted
--     after shown; not authoritative.
-- -----------------------------------------------------------------------------
-- Run in Supabase SQL Editor (service role) or psql.
-- -----------------------------------------------------------------------------

WITH RECURSIVE xp_growth AS (
  SELECT
    10 AS n,
    4800::bigint AS prev_before,
    1200::bigint AS incr
  UNION ALL
  SELECT
    n + 1,
    prev_before + incr,
    LEAST(6000, ROUND(incr * 1.04::numeric))::bigint
  FROM xp_growth
  WHERE n < 99
),
xp_thresholds AS (
  SELECT
    (ord::int - 1) AS level_idx,
    val::bigint AS xp_min
  FROM unnest(ARRAY[
    0::bigint,
    100,
    250,
    500,
    850,
    1300,
    1900,
    2650,
    3600,
    4800
  ]) WITH ORDINALITY AS t(val, ord)
  UNION ALL
  SELECT
    n AS level_idx,
    prev_before + incr AS xp_min
  FROM xp_growth
),
roster AS (
  SELECT id AS user_id FROM public.users
  UNION
  SELECT id AS user_id FROM auth.users
)
SELECT
  r.user_id,
  au.email,
  pu.display_name,
  (au.id IS NOT NULL) AS has_auth_user,
  (ux.user_id IS NOT NULL) AS has_user_xp_row,
  COALESCE(ux.total_xp, 0) AS total_xp,
  (SELECT MAX(t.level_idx) FROM xp_thresholds t WHERE COALESCE(ux.total_xp, 0) >= t.xp_min)
    + 1 AS level,
  ux.updated_at AS user_xp_updated_at
FROM roster r
LEFT JOIN auth.users au ON au.id = r.user_id
LEFT JOIN public.users pu ON pu.id = r.user_id
LEFT JOIN public.user_xp ux ON ux.user_id = r.user_id
ORDER BY total_xp DESC NULLS LAST, au.email NULLS LAST, r.user_id;

-- -----------------------------------------------------------------------------
-- Optional: same roster, plus xp_events rollups (audit / "older data" trail)
-- -----------------------------------------------------------------------------
-- WITH roster AS (
--   SELECT id AS user_id FROM public.users
--   UNION
--   SELECT id AS user_id FROM auth.users
-- ),
-- ev AS (
--   SELECT
--     user_id,
--     SUM(amount)::bigint AS sum_xp_events,
--     MIN(created_at) AS first_xp_event_at,
--     MAX(created_at) AS last_xp_event_at,
--     COUNT(*)::int AS xp_event_count
--   FROM public.xp_events
--   GROUP BY user_id
-- )
-- SELECT
--   r.user_id,
--   au.email,
--   COALESCE(ux.total_xp, 0) AS user_xp_total,
--   COALESCE(ev.sum_xp_events, 0) AS sum_logged_xp_events,
--   ev.first_xp_event_at,
--   ev.last_xp_event_at,
--   ev.xp_event_count,
--   COALESCE(ux.total_xp, 0) - COALESCE(ev.sum_xp_events, 0) AS delta_total_minus_events
-- FROM roster r
-- LEFT JOIN auth.users au ON au.id = r.user_id
-- LEFT JOIN public.user_xp ux ON ux.user_id = r.user_id
-- LEFT JOIN ev ON ev.user_id = r.user_id
-- ORDER BY user_xp_total DESC NULLS LAST;

-- -----------------------------------------------------------------------------
-- user_xp rows with no auth user (common reason data "vanished" from auth-only queries)
-- -----------------------------------------------------------------------------
-- SELECT ux.user_id, ux.total_xp, ux.updated_at, pu.display_name, pu.email AS users_table_email
-- FROM public.user_xp ux
-- LEFT JOIN auth.users au ON au.id = ux.user_id
-- LEFT JOIN public.users pu ON pu.id = ux.user_id
-- WHERE au.id IS NULL;
