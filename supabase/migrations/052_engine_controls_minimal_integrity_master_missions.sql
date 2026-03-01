-- NEUROHQ — Engine controls: Minimal Integrity threshold + Master Pool auto-missions toggle
-- Run after 051_tasks_hobby_tag.sql

-- 1) Minimal Integrity drempel op behavior_profile
alter table if exists public.behavior_profile
  add column if not exists minimal_integrity_threshold_days smallint not null default 3
    check (minimal_integrity_threshold_days >= 1 and minimal_integrity_threshold_days <= 14);

comment on column public.behavior_profile.minimal_integrity_threshold_days is
  'Number of inactive days before Minimal Integrity becomes active (engine anti-escape); default 3.';

-- 2) Auto-missies uit Master Pool via user_preferences (standaard AAN)
alter table if exists public.user_preferences
  add column if not exists auto_master_missions boolean not null default true;

comment on column public.user_preferences.auto_master_missions is
  'When true (default), auto-create Master Pool missions when opening /tasks. When false, ensureMasterMissionsForToday is a no-op. Standaard aan.';

