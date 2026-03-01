-- NEUROHQ — XP event log for auditing and insights
-- Run after 041_tasks_validation_type.sql

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount integer not null,
  source_type text not null,
  task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_xp_events_user_created on public.xp_events(user_id, created_at desc);
create index if not exists idx_xp_events_task on public.xp_events(task_id) where task_id is not null;

alter table public.xp_events enable row level security;
create policy "users_own_xp_events" on public.xp_events for all using (auth.uid() = user_id);

comment on table public.xp_events is 'Log of XP awarded: source_type e.g. task_complete, bonus, respec_refund';