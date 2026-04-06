-- Persist weekly budget review completion (Insight / command strip CTA).

create table if not exists public.budget_weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists budget_weekly_reviews_user_week_idx
  on public.budget_weekly_reviews(user_id, week_start desc);

alter table public.budget_weekly_reviews enable row level security;

drop policy if exists "budget_weekly_reviews_select_own" on public.budget_weekly_reviews;
create policy "budget_weekly_reviews_select_own"
  on public.budget_weekly_reviews for select
  using (auth.uid() = user_id);

drop policy if exists "budget_weekly_reviews_insert_own" on public.budget_weekly_reviews;
create policy "budget_weekly_reviews_insert_own"
  on public.budget_weekly_reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "budget_weekly_reviews_update_own" on public.budget_weekly_reviews;
create policy "budget_weekly_reviews_update_own"
  on public.budget_weekly_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
