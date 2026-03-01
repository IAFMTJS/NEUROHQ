-- NEUROHQ — Validation type per task (binary, structured, high_stakes)
-- Run after 040_analytics_events.sql

alter table public.tasks
  add column if not exists validation_type text check (validation_type is null or validation_type in ('binary', 'structured', 'high_stakes'));

comment on column public.tasks.validation_type is 'How completion is validated: binary (done/not), structured (checklist), high_stakes (review/approval)';