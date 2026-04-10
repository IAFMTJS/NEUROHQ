-- -----------------------------------------------------------------------------
-- Sync public.user_xp.total_xp to SUM(public.xp_events.amount) for ONE user
--
-- Your case (example): user_xp_now = 888, sum_xp_events = 11935 → ledger suggests
-- the live counter is far below everything that was logged via addXP(source_type).
--
-- WHEN THIS IS APPROPRIATE
--   You trust xp_events as the source of truth and believe user_xp was reset/wrong.
--
-- WHEN THIS IS WRONG
--   Legitimate deductXP() — it lowers user_xp but does NOT insert xp_events, so
--   sum(events) can be higher than "true" XP. For ~11k gap, penalties alone are
--   unlikely (penalty is capped small per call); still confirm in app history.
--
-- Run as service role / postgres. Always PREVIEW first.
-- -----------------------------------------------------------------------------

-- ↓↓↓ Change this UUID if needed ↓↓↓
WITH params AS (
  SELECT 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'::uuid AS uid
),
agg AS (
  SELECT p.uid AS user_id, COALESCE(SUM(e.amount), 0)::int AS sum_ev
  FROM params p
  LEFT JOIN public.xp_events e ON e.user_id = p.uid
  GROUP BY p.uid
)
SELECT
  p.uid AS user_id,
  au.email,
  ux.total_xp AS user_xp_before,
  a.sum_ev AS sum_xp_events,
  (a.sum_ev - COALESCE(ux.total_xp, 0)) AS delta_if_sync,
  a.sum_ev AS user_xp_after_if_sync
FROM params p
CROSS JOIN agg a
LEFT JOIN public.user_xp ux ON ux.user_id = p.uid
LEFT JOIN auth.users au ON au.id = p.uid;

-- ---------------------------------------------------------------------------
-- APPLY — uncomment and run AFTER preview (same UUID in params CTE)
-- ---------------------------------------------------------------------------
/*
BEGIN;

WITH params AS (
  SELECT 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'::uuid AS uid
),
agg AS (
  SELECT p.uid AS user_id, COALESCE(SUM(e.amount), 0)::int AS new_total
  FROM params p
  LEFT JOIN public.xp_events e ON e.user_id = p.uid
  GROUP BY p.uid
)
INSERT INTO public.user_xp (user_id, total_xp, updated_at)
SELECT user_id, new_total, now()
FROM agg
ON CONFLICT (user_id) DO UPDATE SET
  total_xp = EXCLUDED.total_xp,
  updated_at = EXCLUDED.updated_at;

COMMIT;
*/
