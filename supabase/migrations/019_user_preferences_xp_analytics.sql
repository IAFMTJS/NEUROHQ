-- NEUROHQ — User preferences (theme, emotion), XP, and daily analytics
-- Run after 018_strategy_enhancements.sql

-- 1. user_preferences (theme, color_mode, selected_emotion)
create table if not exists public.user_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  theme text not null default 'normal' check (theme in ('normal', 'girly', 'industrial')),
  color_mode text not null default 'dark' check (color_mode in ('dark', 'light')),
  selected_emotion text check (selected_emotion is null or selected_emotion in (
    'drained', 'sleepy', 'questioning', 'motivated', 'excited', 'angry', 'neon', 'hyped', 'evil'
  )),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "users_own_preferences" on public.user_preferences
  for all using (auth.uid() = user_id);

-- 2. user_xp (total XP and optional level)
create table if not exists public.user_xp (
  user_id uuid primary key references public.users(id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_xp enable row level security;

create policy "users_own_xp" on public.user_xp
  for all using (auth.uid() = user_id);

-- 3. user_analytics_daily (denormalized daily stats for reporting)
create table if not exists public.user_analytics_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  active_seconds integer not null default 0,
  tasks_completed smallint not null default 0,
  tasks_planned smallint not null default 0,
  learning_minutes smallint not null default 0,
  brain_status_logged boolean not null default false,
  carry_over_count smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

alter table public.user_analytics_daily enable row level security;

create policy "users_own_analytics" on public.user_analytics_daily
  for all using (auth.uid() = user_id);

create index if not exists idx_user_analytics_daily_user_date
  on public.user_analytics_daily(user_id, date);

-- Optional: mood_note on daily_state (qualitative mood)
alter table public.daily_state
  add column if not exists mood_note text;

comment on table public.user_preferences is 'Theme, color mode, and selected emotion for mood-based UI';
comment on table public.user_xp is 'Accumulated XP for gamification';
comment on table public.user_analytics_daily is 'Daily aggregates for personal analytics (time used, consistency, improvements)';
