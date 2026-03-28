-- =============================================================================
-- NEUROHQ — Push notifications sent for one user (today)
--
-- Source of truth for server-side sends: public.push_sends_log
--   (inserted in lib/push.ts after a successful web push). RLS blocks normal
--   clients; run this in Supabase Dashboard → SQL Editor as a privileged role
--   (service role / postgres), or via psql with service credentials.
--
-- Replace the UUID below with your auth user id (auth.users.id / public.users.id).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. All pushes logged today in UTC (calendar date in UTC)
-- -----------------------------------------------------------------------------
SELECT
  id,
  trigger_type,
  sent_at,
  (sent_at AT TIME ZONE 'UTC')::date AS sent_on_utc_date
FROM public.push_sends_log
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND (sent_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
ORDER BY sent_at ASC;

-- -----------------------------------------------------------------------------
-- 2. Same sends, but "today" in the user's profile timezone (matches daily cap
--    logic that uses users.timezone). If timezone is null, falls back to UTC.
-- -----------------------------------------------------------------------------
WITH u AS (
  SELECT COALESCE(timezone, 'UTC') AS tz
  FROM public.users
  WHERE id = '00000000-0000-0000-0000-000000000000'::uuid
)
SELECT
  p.id,
  p.trigger_type,
  p.sent_at,
  date(timezone(u.tz, p.sent_at)) AS local_calendar_date
FROM public.push_sends_log p
CROSS JOIN u
WHERE p.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND date(timezone(u.tz, p.sent_at)) = date(timezone(u.tz, now()))
ORDER BY p.sent_at ASC;

-- -----------------------------------------------------------------------------
-- 3. Optional: HQ alerts that had a push sent (in-app mirror; not every push type)
-- -----------------------------------------------------------------------------
SELECT
  id,
  title,
  push_tag,
  push_sent_at,
  created_at
FROM public.user_alerts
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND push_sent_at IS NOT NULL
  AND (push_sent_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
ORDER BY push_sent_at ASC;

-- -----------------------------------------------------------------------------
-- 4. Optional: push opens recorded today (push_engagement.event_type = 'clicked')
-- -----------------------------------------------------------------------------
SELECT
  id,
  tag,
  created_at
FROM public.push_engagement
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND event_type = 'clicked'
  AND (created_at AT TIME ZONE 'UTC')::date = (now() AT TIME ZONE 'UTC')::date
ORDER BY created_at ASC;
