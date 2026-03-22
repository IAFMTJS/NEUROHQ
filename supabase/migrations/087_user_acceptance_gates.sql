-- Future: engine-driven lock / reflection when acceptance thresholds are exceeded (see docs/UPDATES_22_03_SCOPE.md).
create table if not exists public.user_acceptance_gates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  gate_type text not null,
  triggered_at timestamptz not null default now(),
  resolved_at timestamptz,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists idx_user_acceptance_gates_user_unresolved
  on public.user_acceptance_gates(user_id)
  where resolved_at is null;

alter table public.user_acceptance_gates enable row level security;

create policy "user_acceptance_gates_own"
  on public.user_acceptance_gates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
