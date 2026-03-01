-- Avoidance tracker: per user + tag (household, administration, social, etc.)
-- Houdt bij hoe vaak categorieën worden geskipt of wel gedaan.

create table if not exists public.avoidance_tracker (
  user_id uuid not null references public.users(id) on delete cascade,
  tag text not null,
  skipped integer not null default 0,
  completed integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, tag)
);

alter table public.avoidance_tracker enable row level security;

create policy "users_own_avoidance_tracker" on public.avoidance_tracker
  for all
  using (auth.uid() = user_id);

comment on table public.avoidance_tracker is 'Tracks avoidance patterns per user and tag (e.g. household, administration, social): skipped vs completed counts.';
comment on column public.avoidance_tracker.tag is 'Avoidance tag: household | administration | social | fitness | …';
comment on column public.avoidance_tracker.skipped is 'How many times missions for this tag were skipped/snoozed.';
comment on column public.avoidance_tracker.completed is 'How many times missions for this tag were completed (resets skipped).';

