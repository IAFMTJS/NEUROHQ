-- Defer platform-game XP/flex until explicit claim (matches quest flow).
-- Backfill: rows that were already completed under auto-grant are marked claimed so claim is idempotent.

alter table public.user_platform_game_progress
  add column if not exists rewards_granted_at timestamptz;

comment on column public.user_platform_game_progress.rewards_granted_at is
  'When bonus XP/flex was claimed; completed_at is win detection only.';

update public.user_platform_game_progress
set rewards_granted_at = coalesce(rewards_granted_at, completed_at)
where completed_at is not null;

-- Read ended games if user has progress (claim + history).
create policy "platform_games_select_if_user_progress" on public.platform_games
  for select using (
    auth.uid() is not null
    and exists (
      select 1 from public.user_platform_game_progress p
      where p.game_id = platform_games.id
        and p.user_id = auth.uid()
    )
  );

-- Read quest campaign if user has progress (claim after window ends).
create policy "platform_quest_campaigns_select_if_user_progress" on public.platform_quest_campaigns
  for select using (
    auth.uid() is not null
    and exists (
      select 1 from public.user_quest_campaign_progress p
      where p.campaign_id = platform_quest_campaigns.id
        and p.user_id = auth.uid()
    )
  );
