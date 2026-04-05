-- Platform-spellen: admins plannen en beheren; alle ingelogde gebruikers zien actieve spellen binnen start/eind.

create table if not exists public.platform_games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_games_ends_after_start check (ends_at is null or ends_at >= starts_at)
);

create index if not exists idx_platform_games_active_starts on public.platform_games (active, starts_at desc);

comment on table public.platform_games is 'Admin-managed games/challenges for all users; visible while active and within starts_at/ends_at. Optional JSON config for rules or parameters.';
comment on column public.platform_games.config is 'Admin-editable parameters (e.g. bonus XP, labels); surfaced read-only in the app when non-empty.';

alter table public.platform_games enable row level security;

create policy "platform_games_select_live_authenticated" on public.platform_games
  for select using (
    auth.uid() is not null
    and active
    and starts_at <= now()
    and (ends_at is null or ends_at >= now())
  );

create policy "platform_games_admin_all" on public.platform_games
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());
