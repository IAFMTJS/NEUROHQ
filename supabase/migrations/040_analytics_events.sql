-- NEUROHQ — Named analytics events (funnel: mission_completed, CTA_clicked, etc.)
-- Run after 039_strategy_focus_archive_reason.sql

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_name text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_user_created on public.analytics_events(user_id, created_at desc);
create index if not exists idx_analytics_events_name on public.analytics_events(event_name, created_at desc);

alter table public.analytics_events enable row level security;
create policy "users_own_analytics_events" on public.analytics_events for all using (auth.uid() = user_id);

comment on table public.analytics_events is 'Named client events for funnel: mission_completed, CTA_clicked, mission_started, skill_unlocked';
