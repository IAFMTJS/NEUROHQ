-- NEUROHQ — User preferences: push notification personality mode
-- Modes:
-- - auto: engine adapts tone based on behaviour (default)
-- - stoic: philosophical minimalism
-- - friendly: encouraging
-- - coach: motivational guidance
-- - drill: aggressive / discipline-focused
-- - chaos: sarcasm + overstimulation mix

alter table if exists public.user_preferences
  add column if not exists push_personality_mode text
    check (push_personality_mode is null or push_personality_mode in ('auto', 'stoic', 'friendly', 'coach', 'drill', 'chaos'));

comment on column public.user_preferences.push_personality_mode is
  'Preferred push notification personality: auto, stoic, friendly, coach, drill, or chaos (sarcasm + overstimulation mix).';

