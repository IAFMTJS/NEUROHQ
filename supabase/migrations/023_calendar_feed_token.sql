-- NEUROHQ — Calendar feed token voor iOS / Apple Kalender (subscribe-URL)
-- Run after 022_assistant_user_context_turn.sql

alter table public.users
  add column if not exists calendar_feed_token text unique;

create index if not exists idx_users_calendar_feed_token
  on public.users(calendar_feed_token)
  where calendar_feed_token is not null;

comment on column public.users.calendar_feed_token is 'Secret token for iCal subscribe URL (iOS / Apple Calendar)';

-- RPC: events ophalen op basis van feed token (voor subscribe-URL zonder sessie)
create or replace function public.get_calendar_feed_events(p_token text)
returns table (
  id uuid,
  title text,
  start_at timestamptz,
  end_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select e.id, e.title, e.start_at, e.end_at
  from calendar_events e
  join users u on u.id = e.user_id and u.calendar_feed_token = p_token
  where e.start_at >= (now() at time zone 'utc') - interval '7 days'
    and e.start_at <= (now() at time zone 'utc') + interval '90 days'
  order by e.start_at asc
  limit 500;
$$;

grant execute on function public.get_calendar_feed_events(text) to anon;
grant execute on function public.get_calendar_feed_events(text) to authenticated;
comment on function public.get_calendar_feed_events(text) is 'Returns calendar events for iCal feed by token (iOS / Apple Calendar subscribe URL)';
