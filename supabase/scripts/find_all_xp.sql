-- -----------------------------------------------------------------------------
-- Find ALL XP-related data (not only public.user_xp)
--
-- WHY user_xp CAN LOOK "TOO LOW" vs what users remember
--   - public.user_xp.total_xp = single current counter the app reads (getXP).
--   - public.xp_events only gets rows when addXP(..., { source_type: "..." }) was used.
--     deductXP() updates user_xp but does NOT insert xp_events.
--     Older code paths may have updated totals without logging.
--   - public.behaviour_log.xp_gained = DCIC mission completion XP (separate trail);
--     task XP usually flows through addXP → user_xp + often xp_events — do not simply
--     ADD behaviour sum + event sum (double-count risk for some flows).
--   - public.user_analytics_daily.xp_earned = daily rollup; may not match events 1:1.
--
-- Use this script to COMPARE sources side by side; the "truth" for the live app is
-- still user_xp.total_xp unless you intentionally repair from a ledger.
--
-- Run with service role / postgres (bypass RLS) to see all users.
-- For roster + derived level only: supabase/scripts/all_users_xp_level.sql
-- -----------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- A) Canonical table only (fast)
-- ---------------------------------------------------------------------------
SELECT *
FROM public.user_xp
ORDER BY total_xp DESC, updated_at DESC;

-- ---------------------------------------------------------------------------
-- B) Readable: user_xp + identity
-- ---------------------------------------------------------------------------
SELECT
  ux.user_id,
  au.email,
  pu.display_name,
  ux.total_xp AS user_xp_total_now,
  ux.updated_at AS user_xp_updated_at
FROM public.user_xp ux
LEFT JOIN auth.users au ON au.id = ux.user_id
LEFT JOIN public.users pu ON pu.id = ux.user_id
ORDER BY ux.total_xp DESC, ux.updated_at DESC;

-- ---------------------------------------------------------------------------
-- C) FULL reconciliation: user_xp vs xp_events vs behaviour_log vs daily rollup
--     (same roster idea as all_users_xp_level.sql)
-- ---------------------------------------------------------------------------
WITH roster AS (
  SELECT id AS user_id FROM public.users
  UNION
  SELECT id AS user_id FROM auth.users
),
ev AS (
  SELECT
    user_id,
    COUNT(*)::bigint AS xp_event_count,
    COALESCE(SUM(amount), 0)::bigint AS sum_xp_events,
    MIN(created_at) AS first_xp_event_at,
    MAX(created_at) AS last_xp_event_at
  FROM public.xp_events
  GROUP BY user_id
),
bh AS (
  SELECT
    user_id,
    COUNT(*) FILTER (WHERE xp_gained IS NOT NULL)::bigint AS behaviour_rows_with_xp,
    COALESCE(SUM(xp_gained), 0)::bigint AS sum_behaviour_xp_gained
  FROM public.behaviour_log
  GROUP BY user_id
),
ad AS (
  SELECT
    user_id,
    COALESCE(SUM(xp_earned), 0)::bigint AS sum_analytics_xp_earned,
    COUNT(*)::bigint AS analytics_day_rows
  FROM public.user_analytics_daily
  GROUP BY user_id
)
SELECT
  r.user_id,
  au.email,
  pu.display_name,
  COALESCE(ux.total_xp, 0) AS user_xp_total_now,
  ux.updated_at AS user_xp_updated_at,
  COALESCE(ev.sum_xp_events, 0) AS sum_all_xp_events,
  COALESCE(ev.xp_event_count, 0) AS xp_event_count,
  ev.first_xp_event_at,
  ev.last_xp_event_at,
  COALESCE(bh.sum_behaviour_xp_gained, 0) AS sum_behaviour_log_xp_gained,
  COALESCE(bh.behaviour_rows_with_xp, 0) AS behaviour_rows_with_xp,
  COALESCE(ad.sum_analytics_xp_earned, 0) AS sum_user_analytics_daily_xp_earned,
  COALESCE(ad.analytics_day_rows, 0) AS analytics_day_row_count,
  /* Positive = user_xp higher than sum of logged events (old grants, manual fix, or events missing) */
  COALESCE(ux.total_xp, 0) - COALESCE(ev.sum_xp_events, 0) AS user_xp_minus_sum_events,
  /* Handy flag: events suggest more was logged than current total (deductions without events, reset, bug) */
  CASE
    WHEN COALESCE(ev.sum_xp_events, 0) > COALESCE(ux.total_xp, 0) THEN true
    ELSE false
  END AS events_exceed_user_xp
FROM roster r
LEFT JOIN auth.users au ON au.id = r.user_id
LEFT JOIN public.users pu ON pu.id = r.user_id
LEFT JOIN public.user_xp ux ON ux.user_id = r.user_id
LEFT JOIN ev ON ev.user_id = r.user_id
LEFT JOIN bh ON bh.user_id = r.user_id
LEFT JOIN ad ON ad.user_id = r.user_id
WHERE
  /* Drop rows with absolutely nothing (optional): comment out the WHERE to see everyone */
  ux.user_id IS NOT NULL
  OR ev.user_id IS NOT NULL
  OR bh.user_id IS NOT NULL
  OR ad.user_id IS NOT NULL
ORDER BY
  user_xp_total_now DESC,
  sum_all_xp_events DESC,
  au.email NULLS LAST;

-- ---------------------------------------------------------------------------
-- D) Users where SUM(xp_events) > user_xp (investigate first for "missing" totals)
-- ---------------------------------------------------------------------------
WITH ev AS (
  SELECT user_id, COALESCE(SUM(amount), 0)::bigint AS s
  FROM public.xp_events
  GROUP BY user_id
)
SELECT
  ux.user_id,
  au.email,
  ux.total_xp AS user_xp_now,
  ev.s AS sum_xp_events,
  (ev.s - ux.total_xp) AS gap_events_minus_user_xp
FROM public.user_xp ux
INNER JOIN ev ON ev.user_id = ux.user_id AND ev.s > ux.total_xp
LEFT JOIN auth.users au ON au.id = ux.user_id
ORDER BY gap_events_minus_user_xp DESC;

-- ---------------------------------------------------------------------------
-- E) Optional: pending one-shot notifications (not authoritative; may be empty)
-- ---------------------------------------------------------------------------
-- SELECT * FROM public.pending_xp_notifications ORDER BY updated_at DESC NULLS LAST;

-- ---------------------------------------------------------------------------
-- F) Per-user: XP events broken down by source_type (replace :user_id)
-- ---------------------------------------------------------------------------
-- SELECT source_type, COUNT(*)::bigint AS n, SUM(amount)::bigint AS total_amount
-- FROM public.xp_events
-- WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
-- GROUP BY source_type
-- ORDER BY total_amount DESC;
