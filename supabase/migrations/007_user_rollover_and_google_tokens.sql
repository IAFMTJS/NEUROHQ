-- Per-user rollover tracking (for hourly cron / timezone-aware rollover)
alter table public.users
  add column if not exists last_rollover_date date;

-- Google Calendar OAuth tokens (Phase 8)
create table if not exists public.user_google_tokens (
  user_id uuid primary key references public.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_google_tokens enable row level security;

create policy "users_own_google_tokens" on public.user_google_tokens for all using (auth.uid() = user_id);
