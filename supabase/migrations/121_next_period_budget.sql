-- Scheduled budget for the next pay period (applied on first day of that period or when user marks payday).

alter table public.users
  add column if not exists next_period_monthly_budget_cents integer null;

alter table public.users
  add column if not exists next_period_monthly_savings_cents integer null;

alter table public.users
  add column if not exists next_budget_period text null
    check (next_budget_period is null or next_budget_period in ('monthly', 'weekly'));

alter table public.users
  add column if not exists next_budget_applies_from date null;
