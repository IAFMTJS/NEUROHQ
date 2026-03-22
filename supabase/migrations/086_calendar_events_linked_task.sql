-- Optional link: calendar event doubles as a mission/task (same title/day).
alter table public.calendar_events
  add column if not exists linked_task_id uuid references public.tasks(id) on delete set null;

create index if not exists idx_calendar_events_linked_task
  on public.calendar_events(user_id, linked_task_id)
  where linked_task_id is not null;
