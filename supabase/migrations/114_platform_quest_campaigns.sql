-- Multi-day platform quest (admin content + per-user progress, rewards).

create table if not exists public.platform_quest_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text not null default '',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  content jsonb not null default '{"version":1,"days":[]}'::jsonb,
  reward_xp integer not null default 1000,
  reward_flex_percent_bp integer not null default 2000,
  achievement_key text not null default 'the_unbreakable',
  badge_label text not null default 'The Unbreakable',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_quest_campaigns_ends_after_start check (ends_at is null or ends_at >= starts_at),
  constraint platform_quest_campaigns_reward_xp_nonneg check (reward_xp >= 0),
  constraint platform_quest_campaigns_flex_bp_nonneg check (reward_flex_percent_bp >= 0 and reward_flex_percent_bp <= 10000)
);

create index if not exists idx_platform_quest_campaigns_active_slug
  on public.platform_quest_campaigns (active, slug);

comment on table public.platform_quest_campaigns is 'Admin-defined multi-day quest; content JSON holds puzzles. Users see FAB on dashboard + always profile during window.';

create table if not exists public.user_quest_campaign_progress (
  user_id uuid not null references public.users (id) on delete cascade,
  campaign_id uuid not null references public.platform_quest_campaigns (id) on delete cascade,
  state jsonb not null default '{"solvedDays":[]}'::jsonb,
  rewards_granted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, campaign_id)
);

create index if not exists idx_user_quest_progress_campaign on public.user_quest_campaign_progress (campaign_id);

comment on table public.user_quest_campaign_progress is 'Per-user quest state: solvedDays, optional multi-step substeps in state JSON.';

alter table public.platform_quest_campaigns enable row level security;
alter table public.user_quest_campaign_progress enable row level security;

-- Authenticated: live campaigns only (same window idea as platform_events).
create policy "platform_quest_campaigns_select_live" on public.platform_quest_campaigns
  for select using (
    auth.uid() is not null
    and active
    and starts_at <= now()
    and (ends_at is null or ends_at >= now())
  );

create policy "platform_quest_campaigns_admin_all" on public.platform_quest_campaigns
  for all
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "user_quest_progress_own" on public.user_quest_campaign_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
