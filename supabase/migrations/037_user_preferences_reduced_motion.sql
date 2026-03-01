-- NEUROHQ — Reduced motion preference (A11y)
-- Run after 036_economy_chains_pressure.sql

alter table public.user_preferences
  add column if not exists reduced_motion boolean not null default false;

comment on column public.user_preferences.reduced_motion is 'When true, minimize animations and transitions for motion sensitivity';
