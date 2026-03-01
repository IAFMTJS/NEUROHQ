-- NEUROHQ — Archive reason for strategy (target met, alignment, fout/succes)
-- Run after 038_tasks_soft_delete.sql

alter table public.strategy_focus
  add column if not exists archive_reason text,
  add column if not exists archive_reason_note text;

comment on column public.strategy_focus.archive_reason is 'target_met | alignment_ok | alignment_fail | custom';
comment on column public.strategy_focus.archive_reason_note is 'Optional note when archiving';
