-- NEUROHQ — Behavior Engine Schema
-- Tracks user behavior patterns, inactivity, accountability, and study planning

-- 1. user_behavior (core behavior tracking)
create table if not exists public.user_behavior (
  user_id uuid primary key references public.users(id) on delete cascade,
  last_active_date date,
  last_study_date date,
  inactive_days smallint not null default 0,
  no_book_selected boolean not null default true,
  weekly_consistency smallint not null default 0 check (weekly_consistency >= 0 and weekly_consistency <= 100),
  missed_reason text check (missed_reason is null or missed_reason in ('no_time', 'no_energy', 'forgot', 'low_motivation')),
  missed_reason_count smallint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_behavior enable row level security;

create policy "users_own_behavior" on public.user_behavior
  for all using (auth.uid() = user_id);

-- 2. study_plan (daily goals and preferred time)
create table if not exists public.study_plan (
  user_id uuid primary key references public.users(id) on delete cascade,
  daily_goal_minutes smallint not null default 30 check (daily_goal_minutes > 0),
  preferred_time time,
  reminder_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.study_plan enable row level security;

create policy "users_own_study_plan" on public.study_plan
  for all using (auth.uid() = user_id);

-- 3. accountability_settings (penalty XP and freeze tokens)
create table if not exists public.accountability_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  enabled boolean not null default true,
  penalty_xp_enabled boolean not null default true,
  penalty_xp_amount smallint not null default 50 check (penalty_xp_amount >= 0),
  streak_freeze_tokens smallint not null default 1 check (streak_freeze_tokens >= 0),
  updated_at timestamptz not null default now()
);

alter table public.accountability_settings enable row level security;

create policy "users_own_accountability" on public.accountability_settings
  for all using (auth.uid() = user_id);

-- 4. weekly_reports (performance reports)
create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  total_minutes smallint not null default 0,
  missions_completed smallint not null default 0,
  streak_status smallint not null default 0,
  rank_progress smallint,
  created_at timestamptz not null default now(),
  unique(user_id, week_start)
);

alter table public.weekly_reports enable row level security;

create policy "users_own_weekly_reports" on public.weekly_reports
  for all using (auth.uid() = user_id);

create index if not exists idx_weekly_reports_user_week
  on public.weekly_reports(user_id, week_start desc);

-- 5. behavior_patterns (AI coach pattern detection)
create table if not exists public.behavior_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  pattern_type text not null check (pattern_type in ('missed_after_busy', 'low_study_time', 'inconsistent_weekend')),
  detected_at timestamptz not null default now(),
  suggestion text,
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.behavior_patterns enable row level security;

create policy "users_own_patterns" on public.behavior_patterns
  for all using (auth.uid() = user_id);

create index if not exists idx_behavior_patterns_user_detected
  on public.behavior_patterns(user_id, detected_at desc);

comment on table public.user_behavior is 'Core behavior tracking: inactivity, consistency, missed reasons';
comment on table public.study_plan is 'Daily study goals and preferred study time';
comment on table public.accountability_settings is 'Accountability mode: penalty XP and freeze tokens';
comment on table public.weekly_reports is 'Weekly performance reports for reflection';
comment on table public.behavior_patterns is 'Detected behavior patterns for AI coach suggestions';
