-- Eenvoudige kaart-inhoud (voorkeur) + gebruikersmeldingen (in-app + push).

alter table if exists public.user_preferences
  add column if not exists simplified_content boolean not null default false;

comment on column public.user_preferences.simplified_content is
  'When true, show shorter copy and fewer shortcut toasts/cards; visuals unchanged.';

create table if not exists public.user_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text,
  severity text not null default 'info'
    check (severity in ('info', 'warning', 'urgent')),
  link_path text,
  read_at timestamptz,
  push_sent_at timestamptz,
  push_tag text,
  created_at timestamptz not null default now()
);

create index if not exists user_alerts_user_created_desc on public.user_alerts (user_id, created_at desc);
create index if not exists user_alerts_pending_push on public.user_alerts (user_id)
  where push_sent_at is null and read_at is null;

alter table public.user_alerts enable row level security;

create policy "users_own_alerts" on public.user_alerts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.user_alerts is 'HQ alerts: mirrored to web push when dispatch runs (immediate or hourly sweep).';
