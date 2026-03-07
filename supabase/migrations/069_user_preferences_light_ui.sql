-- NEUROHQ — Light UI preference (low cinematic, fast interactions)
alter table public.user_preferences
  add column if not exists light_ui boolean not null default false;

comment on column public.user_preferences.light_ui is 'When true, minimal animations and short transitions for a fast, low-cinematic UI';
