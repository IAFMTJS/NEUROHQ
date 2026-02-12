-- NEUROHQ — Initial schema (tables)
-- Run in Supabase SQL Editor or via Supabase CLI

-- 1. users (profile; extends auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  timezone text,
  role text default 'user' check (role in ('user', 'admin')),
  push_subscription_json jsonb,
  push_quote_enabled boolean default true,
  push_quote_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. daily_state
create table if not exists public.daily_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  energy smallint check (energy >= 1 and energy <= 10),
  focus smallint check (focus >= 1 and focus <= 10),
  sensory_load smallint check (sensory_load >= 1 and sensory_load <= 10),
  sleep_hours numeric(3,1),
  social_load smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

-- 3. tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  carry_over_count smallint not null default 0,
  energy_required smallint check (energy_required is null or (energy_required >= 1 and energy_required <= 10)),
  priority smallint check (priority is null or (priority >= 1 and priority <= 5)),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. budget_entries (with 24h freeze columns)
create table if not exists public.budget_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount_cents integer not null,
  date date not null,
  category text,
  note text,
  is_planned boolean not null default false,
  freeze_until timestamptz,
  freeze_reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. savings_goals
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  target_cents integer not null,
  current_cents integer not null default 0,
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. learning_sessions
create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  minutes smallint not null,
  date date not null,
  topic text,
  created_at timestamptz not null default now()
);

-- 7. education_options
create table if not exists public.education_options (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  interest_score smallint check (interest_score is null or (interest_score >= 1 and interest_score <= 10)),
  future_value_score smallint check (future_value_score is null or (future_value_score >= 1 and future_value_score <= 10)),
  effort_score smallint check (effort_score is null or (effort_score >= 1 and effort_score <= 10)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. calendar_events
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  external_id text,
  title text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  duration_hours numeric(4,2),
  is_social boolean not null default false,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. quotes (global; id 1-365 = day of year)
create table if not exists public.quotes (
  id smallint primary key check (id >= 1 and id <= 365),
  author_name text not null,
  era text not null,
  topic text,
  quote_text text not null,
  created_at timestamptz not null default now()
);

-- 10. feature_flags
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  enabled boolean not null default false,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name, user_id)
);

-- 11. alternatives
create table if not exists public.alternatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  reference_id uuid,
  suggestion_text text not null,
  created_at timestamptz not null default now()
);

-- 12. quarterly_strategy
create table if not exists public.quarterly_strategy (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  quarter smallint not null check (quarter >= 1 and quarter <= 4),
  year smallint not null,
  primary_theme text,
  secondary_theme text,
  savings_goal_id uuid references public.savings_goals(id) on delete set null,
  identity_statement text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, year, quarter)
);

-- Indexes
create index if not exists idx_daily_state_user_date on public.daily_state(user_id, date);
create index if not exists idx_tasks_user_due on public.tasks(user_id, due_date);
create index if not exists idx_tasks_user_due_completed on public.tasks(user_id, due_date, completed);
create index if not exists idx_budget_entries_user_date on public.budget_entries(user_id, date);
create index if not exists idx_learning_sessions_user_date on public.learning_sessions(user_id, date);
create index if not exists idx_calendar_events_user_start on public.calendar_events(user_id, start_at);
create index if not exists idx_feature_flags_name on public.feature_flags(name);

-- RLS helper: check if current user is admin without triggering RLS on public.users (avoids infinite recursion)
create or replace function public.current_user_is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;
