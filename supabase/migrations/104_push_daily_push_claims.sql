-- Serialize concurrent cron invocations: one in-flight "daily" push per (user, local calendar day, trigger tag).
-- Without this, parallel /api/cron/hourly runs can all pass hasSentTriggerToday and duplicate web pushes.

create table if not exists public.push_daily_push_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  local_date date not null,
  trigger_type text not null,
  created_at timestamptz not null default now(),
  unique (user_id, local_date, trigger_type)
);

create index if not exists idx_push_daily_claims_user_date
  on public.push_daily_push_claims (user_id, local_date desc);

alter table public.push_daily_push_claims enable row level security;

create policy "no_user_access_push_daily_push_claims" on public.push_daily_push_claims
  for all using (false);

comment on table public.push_daily_push_claims is
  'Claim row before sending a once-per-local-day push so parallel cron workers cannot duplicate delivery.';
