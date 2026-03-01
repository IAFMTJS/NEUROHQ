-- Budget period, savings contributions, impulse refinements, recurring templates, category limits

-- 1. Users: budget period (monthly | weekly), impulse quick-add window, risk categories
alter table public.users
  add column if not exists budget_period text default 'monthly',
  add column if not exists impulse_quick_add_minutes smallint default null,
  add column if not exists impulse_risk_categories jsonb default null;

comment on column public.users.budget_period is 'monthly or weekly; affects how spendable is interpreted';
comment on column public.users.impulse_quick_add_minutes is 'Flag expense as possible impulse if added within this many minutes of opening flow; null = off';
comment on column public.users.impulse_risk_categories is 'JSON array of category names that are high impulse risk when unplanned';

alter table public.users drop constraint if exists users_budget_period_check;
alter table public.users add constraint users_budget_period_check check (budget_period in ('monthly', 'weekly'));

-- 2. Savings contributions (log each add for history and "added this week/month")
create table if not exists public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  contributed_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_savings_contributions_goal on public.savings_contributions(goal_id);
create index if not exists idx_savings_contributions_user_date on public.savings_contributions(user_id, contributed_at);

alter table public.savings_contributions enable row level security;
create policy "users_own_savings_contributions" on public.savings_contributions for all using (auth.uid() = user_id);

-- 3. Recurring budget templates (cron generates actual entries)
create table if not exists public.recurring_budget_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount_cents integer not null,
  category text,
  note text,
  recurrence_rule text not null check (recurrence_rule in ('weekly', 'monthly')),
  day_of_week smallint check (day_of_week is null or (day_of_week >= 0 and day_of_week <= 6)),
  day_of_month smallint check (day_of_month is null or (day_of_month >= 1 and day_of_month <= 31)),
  next_generate_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.recurring_budget_templates.day_of_week is '0=Sunday..6=Saturday for weekly';
comment on column public.recurring_budget_templates.day_of_month is '1-31 for monthly';

create index if not exists idx_recurring_budget_templates_user_next on public.recurring_budget_templates(user_id, next_generate_date);

alter table public.recurring_budget_templates enable row level security;
create policy "users_own_recurring_templates" on public.recurring_budget_templates for all using (auth.uid() = user_id);

-- 4. Category limits per user (optional monthly limit per category)
create table if not exists public.user_category_limits (
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null,
  limit_cents integer not null check (limit_cents > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, category)
);

alter table public.user_category_limits enable row level security;
create policy "users_own_category_limits" on public.user_category_limits for all using (auth.uid() = user_id);
