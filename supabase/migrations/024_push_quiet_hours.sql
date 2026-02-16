-- NEUROHQ — Quiet hours for push (no push in user-defined window, e.g. 22:00–08:00)
-- Run after 023_calendar_feed_token.sql

alter table public.users
  add column if not exists push_quiet_hours_start time,
  add column if not exists push_quiet_hours_end time;

comment on column public.users.push_quiet_hours_start is 'Start of quiet window (user local time); no push in [start, end).';
comment on column public.users.push_quiet_hours_end is 'End of quiet window (user local time).';
