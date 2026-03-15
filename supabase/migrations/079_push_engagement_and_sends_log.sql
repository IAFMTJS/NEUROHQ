-- NEUROHQ — Push engagement (click tracking) and send log (for re-engagement backoff).
-- push_engagement: record when user opens app from a push (event_type = 'clicked') for fatigue-based cap.
-- push_sends_log: record every push send by tag/trigger so we can limit re-engagement sends per week.

create table if not exists public.push_engagement (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null check (event_type in ('sent', 'clicked')),
  tag text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_engagement_user_created
  on public.push_engagement(user_id, created_at desc);

alter table public.push_engagement enable row level security;

create policy "users_own_push_engagement" on public.push_engagement
  for all using (auth.uid() = user_id);

comment on table public.push_engagement is
  'Tracks push notification engagement: clicked when user opens from push; used for fatigue-based daily cap.';

create table if not exists public.push_sends_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  trigger_type text not null,
  sent_at timestamptz not null default now()
);

create index if not exists idx_push_sends_log_user_sent
  on public.push_sends_log(user_id, sent_at desc);

alter table public.push_sends_log enable row level security;

-- Only service role (cron) can write; no user access (RLS denies all, service_role bypasses RLS).
create policy "no_user_access_push_sends_log" on public.push_sends_log
  for all using (false);

comment on table public.push_sends_log is
  'Log of every push send by trigger_type; used to cap re-engagement (inactivity_*) pushes per week.';
