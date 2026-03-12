-- NEUROHQ — Behavioral notifications log (per-trigger cooldown + escalation)
-- Tracks last_sent_at and ignored_count per user and trigger_type so the
-- Behavioral Notification Engine can enforce cooldowns and escalation
-- (e.g. 24h between inactivity nudges, progressive wording on repeated ignores).

create table if not exists public.behavioral_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  trigger_type text not null,
  last_sent_at timestamptz not null default now(),
  ignored_count smallint not null default 0 check (ignored_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, trigger_type)
);

alter table public.behavioral_notifications enable row level security;

create policy "users_own_behavioral_notifications" on public.behavioral_notifications
  for all using (auth.uid() = user_id);

comment on table public.behavioral_notifications is
  'Per-user behavioural notification log: trigger_type, last_sent_at, ignored_count for cooldown and escalation.';

comment on column public.behavioral_notifications.trigger_type is
  'Behavioural trigger key (e.g. inactivity_3d, streak_protection, brain_status_reminder).';

