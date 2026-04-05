-- Atomic "stop quest": remove the live campaign row (cascades user progress), re-insert same slug/content as inactive template.

create or replace function public.admin_archive_quest_campaign_to_template(p_campaign_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.platform_quest_campaigns%rowtype;
  v_new uuid;
  v_now timestamptz := now();
begin
  if auth.uid() is null or not public.current_user_is_admin() then
    raise exception 'Geen beheerderstoegang.';
  end if;

  select * into strict r from public.platform_quest_campaigns where id = p_campaign_id;

  delete from public.platform_quest_campaigns where id = p_campaign_id;

  insert into public.platform_quest_campaigns (
    slug, title, tagline, content, reward_xp, reward_flex_percent_bp,
    achievement_key, badge_label, prize_summary, active, starts_at, ends_at, created_at, updated_at
  ) values (
    r.slug, r.title, r.tagline, r.content, r.reward_xp, r.reward_flex_percent_bp,
    r.achievement_key, r.badge_label, r.prize_summary, false,
    timestamptz '2099-01-01 00:00:00+00', null, v_now, v_now
  )
  returning id into strict v_new;

  return v_new;
end;
$$;

comment on function public.admin_archive_quest_campaign_to_template(uuid) is
  'Admin: deletes quest campaign row (cascades progress), inserts inactive copy with placeholder starts_at for re-scheduling.';

revoke all on function public.admin_archive_quest_campaign_to_template(uuid) from public;
grant execute on function public.admin_archive_quest_campaign_to_template(uuid) to authenticated;
