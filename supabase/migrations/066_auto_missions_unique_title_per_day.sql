-- Prevent duplicate auto-missions (same title, same user, same day).
-- Step 1: Remove existing duplicates (keep one per user_id, due_date, title; keep the oldest by id).
WITH dups AS (
  SELECT id,
    row_number() OVER (PARTITION BY user_id, due_date, title ORDER BY id) AS rn
  FROM public.tasks
  WHERE psychology_label = 'MasterPoolAuto' AND deleted_at IS NULL
)
DELETE FROM public.tasks
WHERE id IN (SELECT id FROM dups WHERE rn > 1);

-- Step 2: Only one active (non-deleted) MasterPoolAuto task per (user_id, due_date, title).
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_auto_mission_unique_title_per_day
  ON public.tasks (user_id, due_date, title)
  WHERE psychology_label = 'MasterPoolAuto' AND deleted_at IS NULL;

COMMENT ON INDEX idx_tasks_auto_mission_unique_title_per_day IS 'Ensures at most one auto-mission per title per user per day; prevents duplicates from concurrent ensureMasterMissionsForToday runs.';
