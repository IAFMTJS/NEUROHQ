-- NEUROHQ — Behavior Profile confrontation mode
-- Instelbare intensiteit voor confronterende missies (mild | standard | strong).

alter table if exists public.behavior_profile
  add column if not exists confrontation_mode text not null default 'standard'
    check (confrontation_mode in ('mild', 'standard', 'strong'));

comment on column public.behavior_profile.confrontation_mode is
  'Confrontatie-intensiteit voor avoidance-missies: mild | standard | strong.';

