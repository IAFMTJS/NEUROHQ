-- NEUROHQ — Base XP per task (level marker: weinig/normaal/veel XP)
-- Run after 042_xp_events.sql

alter table public.tasks
  add column if not exists base_xp smallint check (base_xp is null or (base_xp >= 1 and base_xp <= 100));

comment on column public.tasks.base_xp is 'Base XP awarded on completion (level: 25=weinig, 50=normaal, 100=veel); null = default 50';