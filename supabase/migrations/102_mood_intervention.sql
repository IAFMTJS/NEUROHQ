-- Mood label on daily check-in row; intervention learning JSON on preferences.

alter table public.daily_state
  add column if not exists mood_label text;

alter table public.daily_state
  drop constraint if exists daily_state_mood_label_check;

alter table public.daily_state
  add constraint daily_state_mood_label_check
  check (
    mood_label is null
    or mood_label in ('overwhelmed', 'tired', 'low', 'sick', 'good', 'physical')
  );

comment on column public.daily_state.mood_label is
  'User mood check-in: overwhelmed, tired, low, sick, physical, good — drives interventions and profile display.';

alter table public.user_preferences
  add column if not exists mood_intervention_json jsonb not null default '{}'::jsonb;

comment on column public.user_preferences.mood_intervention_json is
  'Mood toast cooldown + learning (e.g. lateNightBiasMinutes) — server-owned.';
