-- Globale platform-events: admins beheren; ingelogde gebruikers zien actieve events binnen het tijdvenster.

create table if not exists public.platform_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_events_ends_after_start check (ends_at is null or ends_at >= starts_at)
);

create index if not exists idx_platform_events_active_starts on public.platform_events (active, starts_at desc);

comment on table public.platform_events is 'Admin-managed announcements shown to all logged-in users while active and within starts_at/ends_at.';

alter table public.platform_events enable row level security;

-- Ingelogde gebruikers: alleen "live" events (voor app + publieke API).
create policy "platform_events_select_live_authenticated" on public.platform_events
  for select using (
    auth.uid() is not null
    and active
    and starts_at <= now()
    and (ends_at is null or ends_at >= now())
  );

-- Admins: alles (beheerconsole).
create policy "platform_events_admin_all" on public.platform_events
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());
