alter table public.user_preferences
  add column if not exists push_reminders_enabled boolean not null default true,
  add column if not exists push_morning_enabled boolean not null default true,
  add column if not exists push_evening_enabled boolean not null default true,
  add column if not exists push_weekly_learning_enabled boolean not null default true;

update public.user_preferences
set
  push_reminders_enabled = coalesce(push_reminders_enabled, true),
  push_morning_enabled = coalesce(push_morning_enabled, true),
  push_evening_enabled = coalesce(push_evening_enabled, true),
  push_weekly_learning_enabled = coalesce(push_weekly_learning_enabled, true)
where
  push_reminders_enabled is null
  or push_morning_enabled is null
  or push_evening_enabled is null
  or push_weekly_learning_enabled is null;

comment on column public.user_preferences.push_reminders_enabled is 'Master toggle for scheduled push reminders. Browser permission/subscription still required.';
comment on column public.user_preferences.push_morning_enabled is 'When true, send the local 09:00 push reminder.';
comment on column public.user_preferences.push_evening_enabled is 'When true, send the local 20:00 push reminder.';
comment on column public.user_preferences.push_weekly_learning_enabled is 'When true, send the weekly learning push reminder.';
