create table if not exists public.user_actions_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_actions_audit enable row level security;

drop policy if exists "users can insert own action audit" on public.user_actions_audit;
create policy "users can insert own action audit"
  on public.user_actions_audit
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can read own action audit" on public.user_actions_audit;
create policy "users can read own action audit"
  on public.user_actions_audit
  for select
  to authenticated
  using (auth.uid() = user_id);

create index if not exists user_actions_audit_user_created_idx
  on public.user_actions_audit (user_id, created_at desc);
