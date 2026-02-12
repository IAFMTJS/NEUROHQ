-- Currency, impulse config, and savings goal status for budget improvements

-- Users: currency and impulse threshold
alter table public.users
  add column if not exists currency text default 'EUR',
  add column if not exists impulse_threshold_pct smallint default 40;

comment on column public.users.currency is 'ISO 4217 code for display (EUR, USD, GBP, etc.)';
comment on column public.users.impulse_threshold_pct is 'Flag expense as possible impulse when > this % of 4-week average (default 40)';

-- Savings goals: status for archive/complete
alter table public.savings_goals
  add column if not exists status text not null default 'active';

comment on column public.savings_goals.status is 'active | completed | cancelled';

-- Constraint for status
alter table public.savings_goals
  drop constraint if exists savings_goals_status_check;
alter table public.savings_goals
  add constraint savings_goals_status_check check (status in ('active', 'completed', 'cancelled'));
