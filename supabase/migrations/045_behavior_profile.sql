-- NEUROHQ — Behavior Profile (identity targets, avoidance, energy pattern, pet, hobbies)
-- Run after 027_identity_engine.sql

create table if not exists public.behavior_profile (
  user_id uuid primary key references public.users(id) on delete cascade,
  identity_targets text[] not null default '{}',
  avoidance_patterns jsonb,
  energy_pattern text not null default 'stable'
    check (energy_pattern in ('morning_low', 'stable', 'evening_crash')),
  discipline_level text not null default 'medium'
    check (discipline_level in ('low', 'medium', 'high')),
  pet_type text not null default 'none'
    check (pet_type in ('none', 'dog', 'cat', 'other')),
  pet_attachment_level smallint not null default 0
    check (pet_attachment_level >= 0 and pet_attachment_level <= 2),
  hobby_commitment jsonb,
  updated_at timestamptz not null default now()
);

alter table public.behavior_profile enable row level security;

create policy "users_own_behavior_profile" on public.behavior_profile
  for all using (auth.uid() = user_id);

comment on table public.behavior_profile is 'Behavior DNA: identity targets, avoidance patterns, energy pattern, discipline level, pet attachment, hobby commitments';
comment on column public.behavior_profile.identity_targets is 'Array of identity labels (e.g. fit_person, disciplined, good_dog_owner, financial_control)';
comment on column public.behavior_profile.avoidance_patterns is 'JSONB: [{\"tag\":\"household\",\"emotion\":\"overwhelm\"}, …]';
comment on column public.behavior_profile.energy_pattern is 'morning_low | stable | evening_crash';
comment on column public.behavior_profile.discipline_level is 'low | medium | high';
comment on column public.behavior_profile.pet_type is 'none | dog | cat | other';
comment on column public.behavior_profile.pet_attachment_level is '0=low, 1=medium, 2=high';
comment on column public.behavior_profile.hobby_commitment is 'JSONB: {\"fitness\":0.6,\"guitar\":0.3,…}';

