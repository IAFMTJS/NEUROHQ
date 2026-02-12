-- Add monthly budget and savings target to users (for spendable = budget - savings - expenses)
alter table public.users
  add column if not exists monthly_budget_cents integer,
  add column if not exists monthly_savings_cents integer;

comment on column public.users.monthly_budget_cents is 'Total amount (cents) available for the month; null = not set';
comment on column public.users.monthly_savings_cents is 'Amount (cents) to save this month; null = not set';
