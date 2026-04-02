-- -----------------------------------------------------------------------------
-- Per user: XP totals as of end of yesterday (UTC) and end of the day before
-- (UTC), plus XP earned on each of those calendar days.
--
-- METHOD
--   Cumulative totals are reconstructed from public.xp_events only:
--     - "Through end of yesterday"     = SUM(amount) WHERE created_at < start of today UTC
--     - "Through end of day before"    = SUM(amount) WHERE created_at < start of yesterday UTC
--   XP gained on a given UTC day = difference between those running totals
--     (or SUM(amount) for events on that date — same thing if no backdated events).
--
-- LIMITS (read before trusting numbers)
--   - user_xp.total_xp is authoritative NOW; not all historical changes are in
--     xp_events (e.g. deductXP() does not insert a row; some older paths may
--     not have logged). Compare column drift_vs_user_xp to spot gaps.
--   - Dates are UTC. For "local yesterday", wrap bounds in your timezone or
--     adjust in a fork of this script.
--   - user_analytics_daily.xp_earned is a separate daily rollup; it may not
--     match event sums row-for-row.
-- -----------------------------------------------------------------------------
-- Run in Supabase SQL Editor (service role) or psql.
-- -----------------------------------------------------------------------------

WITH bounds AS (
  SELECT
    (timezone('utc', now()))::date AS utc_today,
    ((timezone('utc', now()))::date - 1) AS utc_yesterday,
    ((timezone('utc', now()))::date - 2) AS utc_day_before_yesterday
),
bounds_ts AS (
  SELECT
    utc_today,
    utc_yesterday,
    utc_day_before_yesterday,
    (utc_today::timestamp AT TIME ZONE 'UTC') AS ts_start_today_utc,
    (utc_yesterday::timestamp AT TIME ZONE 'UTC') AS ts_start_yesterday_utc,
    (utc_day_before_yesterday::timestamp AT TIME ZONE 'UTC') AS ts_start_day_before_yesterday_utc
  FROM bounds
),
roster AS (
  SELECT id AS user_id FROM public.users
  UNION
  SELECT id AS user_id FROM auth.users
),
from_events AS (
  SELECT
    e.user_id,
    /* Through end of UTC calendar day (today - 3): events before start of (today - 2) */
    SUM(e.amount) FILTER (WHERE e.created_at < b.ts_start_day_before_yesterday_utc)::bigint
      AS xp_thru_end_three_days_ago,
    /* Through end of "day before yesterday" UTC: events before start of "yesterday" UTC */
    SUM(e.amount) FILTER (WHERE e.created_at < b.ts_start_yesterday_utc)::bigint
      AS xp_at_end_of_day_before_yesterday_utc,
    /* Through end of "yesterday" UTC: events before start of "today" UTC */
    SUM(e.amount) FILTER (WHERE e.created_at < b.ts_start_today_utc)::bigint
      AS xp_at_end_of_yesterday_utc,
    SUM(e.amount)::bigint AS sum_all_xp_events
  FROM public.xp_events e
  CROSS JOIN bounds_ts b
  GROUP BY e.user_id
),
from_daily AS (
  SELECT
    d.user_id,
    MAX(d.xp_earned) FILTER (WHERE d.date = (SELECT utc_yesterday FROM bounds))::bigint
      AS analytics_xp_earned_yesterday,
    MAX(d.xp_earned) FILTER (WHERE d.date = (SELECT utc_day_before_yesterday FROM bounds))::bigint
      AS analytics_xp_earned_day_before_yesterday
  FROM public.user_analytics_daily d
  WHERE d.date IN ((SELECT utc_yesterday FROM bounds), (SELECT utc_day_before_yesterday FROM bounds))
  GROUP BY d.user_id
)
SELECT
  r.user_id,
  au.email,
  pu.display_name,
  (SELECT utc_day_before_yesterday FROM bounds) AS utc_date_day_before_yesterday,
  (SELECT utc_yesterday FROM bounds) AS utc_date_yesterday,
  (SELECT utc_today FROM bounds) AS utc_date_today,
  COALESCE(fe.xp_at_end_of_day_before_yesterday_utc, 0) AS xp_had_at_end_of_day_before_yesterday_utc,
  COALESCE(fe.xp_at_end_of_yesterday_utc, 0) AS xp_had_at_end_of_yesterday_utc,
  COALESCE(fe.xp_at_end_of_day_before_yesterday_utc, 0) - COALESCE(fe.xp_thru_end_three_days_ago, 0)
    AS xp_gained_on_day_before_yesterday_utc,
  COALESCE(fe.xp_at_end_of_yesterday_utc, 0) - COALESCE(fe.xp_at_end_of_day_before_yesterday_utc, 0)
    AS xp_gained_on_yesterday_utc,
  fd.analytics_xp_earned_day_before_yesterday,
  fd.analytics_xp_earned_yesterday,
  ux.total_xp AS user_xp_current_total,
  COALESCE(fe.sum_all_xp_events, 0) AS sum_all_xp_events,
  COALESCE(ux.total_xp, 0) - COALESCE(fe.sum_all_xp_events, 0) AS drift_user_xp_minus_event_sum
FROM roster r
LEFT JOIN auth.users au ON au.id = r.user_id
LEFT JOIN public.users pu ON pu.id = r.user_id
LEFT JOIN public.user_xp ux ON ux.user_id = r.user_id
LEFT JOIN from_events fe ON fe.user_id = r.user_id
LEFT JOIN from_daily fd ON fd.user_id = r.user_id
WHERE
  COALESCE(fe.sum_all_xp_events, 0) <> 0
  OR COALESCE(ux.total_xp, 0) <> 0
  OR fd.analytics_xp_earned_yesterday IS NOT NULL
  OR fd.analytics_xp_earned_day_before_yesterday IS NOT NULL
ORDER BY COALESCE(ux.total_xp, 0) DESC, r.user_id;

-- -----------------------------------------------------------------------------
-- Same report but include every roster row (zeros everywhere for inactive users)
-- -----------------------------------------------------------------------------
-- Remove the WHERE clause above, or replace it with: WHERE true
