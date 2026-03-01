-- Monthly book goal (1 book per month per Ultra Spec)
create table if not exists public.monthly_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  year smallint not null,
  month smallint not null check (month >= 1 and month <= 12),
  title text not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, year, month)
);

create index if not exists idx_monthly_books_user_year_month on public.monthly_books(user_id, year, month);
alter table public.monthly_books enable row level security;
create policy "users_own_monthly_books" on public.monthly_books for all using (auth.uid() = user_id);
