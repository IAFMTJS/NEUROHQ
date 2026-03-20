create table if not exists public.budget_control_locks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lock_from date not null,
  lock_until date not null,
  reason text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists budget_control_locks_user_active_idx
  on public.budget_control_locks(user_id, active, lock_until desc);

create table if not exists public.budget_emergency_expense_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  amount_cents integer not null check (amount_cents >= 0),
  category text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists budget_emergency_expense_logs_user_date_idx
  on public.budget_emergency_expense_logs(user_id, date desc);

create table if not exists public.payday_reflection_surveys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  survey_date date not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payday_reflection_surveys_user_date_idx
  on public.payday_reflection_surveys(user_id, survey_date desc);

create table if not exists public.budget_training_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists budget_training_logs_user_created_idx
  on public.budget_training_logs(user_id, created_at desc);

create table if not exists public.budget_optimization_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_key text not null,
  status text not null default 'completed',
  reward_xp integer not null default 0 check (reward_xp >= 0),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists budget_optimization_challenges_user_key_idx
  on public.budget_optimization_challenges(user_id, challenge_key, completed_at desc);

alter table public.budget_control_locks enable row level security;
alter table public.budget_emergency_expense_logs enable row level security;
alter table public.payday_reflection_surveys enable row level security;
alter table public.budget_training_logs enable row level security;
alter table public.budget_optimization_challenges enable row level security;

drop policy if exists "budget_control_locks_select_own" on public.budget_control_locks;
create policy "budget_control_locks_select_own"
  on public.budget_control_locks for select
  using (auth.uid() = user_id);

drop policy if exists "budget_control_locks_insert_own" on public.budget_control_locks;
create policy "budget_control_locks_insert_own"
  on public.budget_control_locks for insert
  with check (auth.uid() = user_id);

drop policy if exists "budget_emergency_expense_logs_insert_own" on public.budget_emergency_expense_logs;
create policy "budget_emergency_expense_logs_insert_own"
  on public.budget_emergency_expense_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "payday_reflection_surveys_insert_own" on public.payday_reflection_surveys;
create policy "payday_reflection_surveys_insert_own"
  on public.payday_reflection_surveys for insert
  with check (auth.uid() = user_id);

drop policy if exists "payday_reflection_surveys_select_own" on public.payday_reflection_surveys;
create policy "payday_reflection_surveys_select_own"
  on public.payday_reflection_surveys for select
  using (auth.uid() = user_id);

drop policy if exists "budget_training_logs_insert_own" on public.budget_training_logs;
create policy "budget_training_logs_insert_own"
  on public.budget_training_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "budget_optimization_challenges_insert_own" on public.budget_optimization_challenges;
create policy "budget_optimization_challenges_insert_own"
  on public.budget_optimization_challenges for insert
  with check (auth.uid() = user_id);

drop policy if exists "budget_optimization_challenges_select_own" on public.budget_optimization_challenges;
create policy "budget_optimization_challenges_select_own"
  on public.budget_optimization_challenges for select
  using (auth.uid() = user_id);

