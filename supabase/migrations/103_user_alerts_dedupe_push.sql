-- Dedupe inbox rows per (user_id, push_tag) and prevent duplicate pushes from races.

-- Remove duplicates: keep earliest created_at per (user_id, push_tag).
delete from public.user_alerts a
where a.id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by user_id, push_tag
        order by created_at asc, id asc
      ) as rn
    from public.user_alerts
    where push_tag is not null
  ) t
  where t.rn > 1
);

create unique index if not exists user_alerts_user_push_tag_unique
  on public.user_alerts (user_id, push_tag)
  where push_tag is not null;

comment on index public.user_alerts_user_push_tag_unique is
  'At most one inbox row per logical push_tag (streak/burnout/unified decision).';
