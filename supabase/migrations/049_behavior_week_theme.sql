-- NEUROHQ — Behavior Profile week theme
-- Opslaan van weekthema in behavior_profile (geen aparte tabel nodig).

alter table if exists public.behavior_profile
  add column if not exists week_theme text
    check (week_theme in ('environment_reset', 'self_discipline', 'health_body', 'courage'));

comment on column public.behavior_profile.week_theme is
  'Current weekly theme: environment_reset | self_discipline | health_body | courage';

