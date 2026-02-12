-- Allow monthly recurrence for tasks

alter table public.tasks
  drop constraint if exists tasks_recurrence_rule_check;

alter table public.tasks
  add constraint tasks_recurrence_rule_check
  check (recurrence_rule is null or recurrence_rule in ('daily', 'weekly', 'monthly'));
