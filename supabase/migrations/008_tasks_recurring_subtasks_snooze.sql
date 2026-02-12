-- Recurring tasks, subtasks, and task snooze (backlog features)

-- recurrence_rule: 'daily' | 'weekly' | null. When set, rollover or cron can create next instance.
alter table public.tasks
  add column if not exists recurrence_rule text check (recurrence_rule is null or recurrence_rule in ('daily', 'weekly'));

-- parent_task_id: for subtasks; self-reference to tasks
alter table public.tasks
  add column if not exists parent_task_id uuid references public.tasks(id) on delete cascade;

-- snooze_until: hide task until this time (user-initiated "snooze to tomorrow" etc.)
alter table public.tasks
  add column if not exists snooze_until timestamptz;

create index if not exists idx_tasks_parent on public.tasks(parent_task_id);
create index if not exists idx_tasks_snooze on public.tasks(user_id, snooze_until) where snooze_until is not null;
