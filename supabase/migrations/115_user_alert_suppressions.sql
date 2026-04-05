-- Remember logical alert keys (push_tag) the user cleared so dashboard sync does not recreate the same signal.

create table if not exists public.user_alert_suppressions (
  user_id uuid not null references public.users(id) on delete cascade,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, dedupe_key)
);

create index if not exists user_alert_suppressions_user_created_desc
  on public.user_alert_suppressions (user_id, created_at desc);

comment on table public.user_alert_suppressions is
  'User dismissed an in-app alert with this dedupe_key; do not insert another row with the same push_tag until the key naturally changes (e.g. new calendar day in tag).';

alter table public.user_alert_suppressions enable row level security;

create policy "users_own_alert_suppressions" on public.user_alert_suppressions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
