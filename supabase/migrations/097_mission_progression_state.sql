-- Mission progression ladders (A5): persist user tier per progression key.

create table if not exists public.mission_progression_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  progression_key text not null,
  current_tier int not null default 0 check (current_tier >= 0),
  completions int not null default 0 check (completions >= 0),
  last_completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, progression_key)
);

create index if not exists mission_progression_state_user_idx
  on public.mission_progression_state (user_id);

create index if not exists mission_progression_state_key_idx
  on public.mission_progression_state (progression_key);

alter table public.mission_progression_state enable row level security;

create policy "mission_progression_state_select_own"
  on public.mission_progression_state for select
  to authenticated
  using (auth.uid() = user_id);

create policy "mission_progression_state_insert_own"
  on public.mission_progression_state for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "mission_progression_state_update_own"
  on public.mission_progression_state for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "mission_progression_state_delete_own"
  on public.mission_progression_state for delete
  to authenticated
  using (auth.uid() = user_id);

comment on table public.mission_progression_state is
  'Per-user mission ladder progression state (tier/completions) for auto mission allocator.';
