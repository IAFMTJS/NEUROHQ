-- Full protocol model: PHASES → WEEKS → tasks (definition_json) + per-user progress

alter table public.protocol_library
  add column if not exists definition_json jsonb not null default '{}'::jsonb;

comment on column public.protocol_library.definition_json is 'Structured protocol: phases, weeks, tasks, difficulty scaling (see lib/growth/protocol-definition.ts)';

create table if not exists public.user_protocol_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  protocol_slug text not null,
  locale text not null default 'nl',
  preferred_tier text not null default 'medium' check (preferred_tier in ('easy', 'medium', 'hard')),
  current_week_index int not null default 1,
  completed_task_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, protocol_slug, locale)
);

create index if not exists user_protocol_progress_user_idx on public.user_protocol_progress (user_id);

alter table public.user_protocol_progress enable row level security;

create policy "user_protocol_progress_select_own"
  on public.user_protocol_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_protocol_progress_insert_own"
  on public.user_protocol_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_protocol_progress_update_own"
  on public.user_protocol_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_protocol_progress_delete_own"
  on public.user_protocol_progress for delete
  to authenticated
  using (auth.uid() = user_id);

comment on table public.user_protocol_progress is 'Per-user state for library protocols: tier, week, completed task ids';
