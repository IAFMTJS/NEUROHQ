-- NEUROHQ — Compact UI preference
-- Run after 028_strategy_check_in.sql

alter table public.user_preferences
  add column if not exists compact_ui boolean not null default false;

comment on column public.user_preferences.compact_ui is 'When true, use denser spacing on dashboard and cards';
