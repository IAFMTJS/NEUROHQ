-- Quarter engine: execution discipline (skip / reschedule / delete) + completes from task_events
create table if not exists public.mission_outcome_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  outcome text not null check (outcome in ('complete', 'skip', 'reschedule', 'delete')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_mission_outcome_user_occurred
  on public.mission_outcome_events (user_id, occurred_at desc);

create index if not exists idx_mission_outcome_user_outcome_occurred
  on public.mission_outcome_events (user_id, outcome, occurred_at desc);

alter table public.mission_outcome_events enable row level security;

create policy "users_own_mission_outcome_events"
  on public.mission_outcome_events
  for all
  using (auth.uid() = user_id);

comment on table public.mission_outcome_events is 'Quarter engine execution log: complete/skip/reschedule/delete for discipline ratio';
