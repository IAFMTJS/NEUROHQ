-- NEUROHQ — Assistant: escalation logs, identity events, assistant feature flags
-- Run after 020_tasks_mental_social_load.sql

-- 1. escalation_logs (immutable; insert only)
create table if not exists public.escalation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tier smallint not null check (tier in (1, 2, 3)),
  trigger_type text,
  evidence_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_escalation_logs_user_created on public.escalation_logs(user_id, created_at desc);
alter table public.escalation_logs enable row level security;

create policy "users_own_escalation_logs" on public.escalation_logs
  for insert with check (auth.uid() = user_id);
create policy "users_read_own_escalation_logs" on public.escalation_logs
  for select using (auth.uid() = user_id);
-- No update/delete: immutable

-- 2. identity_events (soft | forced | override)
create table if not exists public.identity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('soft', 'forced', 'override')),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_identity_events_user_created on public.identity_events(user_id, created_at desc);
alter table public.identity_events enable row level security;

create policy "users_own_identity_events" on public.identity_events
  for all using (auth.uid() = user_id);

-- 3. assistant_feature_flags (per-user assistant behaviour)
create table if not exists public.assistant_feature_flags (
  user_id uuid primary key references public.users(id) on delete cascade,
  confrontation_level text not null default 'adaptive' check (confrontation_level in ('adaptive', 'corrective', 'hard')),
  identity_intervention boolean not null default false,
  defensive_identity_detection boolean not null default false,
  courage_attribution boolean not null default false,
  energy_fact_check boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.assistant_feature_flags enable row level security;

create policy "users_own_assistant_flags" on public.assistant_feature_flags
  for all using (auth.uid() = user_id);

comment on table public.escalation_logs is 'Log of assistant escalation events (tier 2/3); immutable';
comment on table public.identity_events is 'Identity interventions: soft, forced, override';
comment on table public.assistant_feature_flags is 'Per-user flags for assistant: confrontation, identity, courage, energy fact-check';
