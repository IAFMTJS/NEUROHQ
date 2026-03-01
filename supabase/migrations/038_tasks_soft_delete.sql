-- NEUROHQ — Soft delete for tasks (undo in UI)
-- Run after 037_user_preferences_reduced_motion.sql

alter table public.tasks
  add column if not exists deleted_at timestamptz;

create index if not exists idx_tasks_deleted_at on public.tasks(user_id, deleted_at) where deleted_at is null;

comment on column public.tasks.deleted_at is 'When set, task is soft-deleted; restore by setting to null';
