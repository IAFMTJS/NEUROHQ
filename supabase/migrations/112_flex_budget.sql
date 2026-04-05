-- Base vs flex budget: flex balance + immutable ledger (idempotent daily rules).

alter table public.users
  add column if not exists flex_budget_cents integer not null default 0
    check (flex_budget_cents >= 0);

alter table public.users
  add column if not exists flex_chunk_cents integer not null default 1000
    check (flex_chunk_cents > 0);

alter table public.users
  add column if not exists flex_cap_monthly_cents integer not null default 20000
    check (flex_cap_monthly_cents >= 0);

alter table public.users
  add column if not exists flex_max_chunks_per_day smallint not null default 2
    check (flex_max_chunks_per_day >= 1 and flex_max_chunks_per_day <= 10);

alter table public.users
  add column if not exists flex_budget_enabled boolean not null default false;

create table if not exists public.flex_budget_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  budget_day date not null,
  created_at timestamptz not null default now(),
  delta_cents integer not null,
  reason text not null,
  idempotency_key text not null,
  strategy_multiplier_bp integer,
  meta jsonb not null default '{}'::jsonb,
  unique (user_id, idempotency_key)
);

create index if not exists flex_budget_ledger_user_day_idx
  on public.flex_budget_ledger (user_id, budget_day desc);

create index if not exists flex_budget_ledger_user_created_idx
  on public.flex_budget_ledger (user_id, created_at desc);

alter table public.flex_budget_ledger enable row level security;

drop policy if exists "flex_budget_ledger_select_own" on public.flex_budget_ledger;
create policy "flex_budget_ledger_select_own"
  on public.flex_budget_ledger for select
  using (auth.uid() = user_id);

drop policy if exists "flex_budget_ledger_insert_own" on public.flex_budget_ledger;
create policy "flex_budget_ledger_insert_own"
  on public.flex_budget_ledger for insert
  with check (auth.uid() = user_id);
