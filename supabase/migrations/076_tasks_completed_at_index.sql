-- Supabase Query Performance report suggested this index for the query:
-- SELECT tasks.completed_at FROM tasks WHERE user_id = $1 AND completed = $2
--   AND completed_at IS NOT NULL AND completed_at >= $3 AND completed_at <= $4 LIMIT $5 OFFSET $6
-- (index_advisor_result: CREATE INDEX ON public.tasks USING btree (completed_at))
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at
  ON public.tasks (completed_at);

COMMENT ON INDEX idx_tasks_completed_at IS 'Speeds up range scans on completed_at (e.g. completed tasks in date range); suggested by Supabase index advisor.';
