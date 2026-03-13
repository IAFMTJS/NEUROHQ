-- NEUROHQ — Ensure user_preferences has days-off and push personality columns.
-- Safe to run multiple times (IF NOT EXISTS). Use if 059 or 075 were skipped or DB was created without them.

-- Days off (from 059_user_preferences_days_off)
alter table if exists public.user_preferences
  add column if not exists usual_days_off smallint[]
    check (
      usual_days_off is null
      or array_length(usual_days_off, 1) between 0 and 7
    );
alter table if exists public.user_preferences
  add column if not exists day_off_mode text
    check (day_off_mode is null or day_off_mode in ('soft', 'hard'));

-- Push personality (from 075_user_preferences_push_personality)
alter table if exists public.user_preferences
  add column if not exists push_personality_mode text
    check (push_personality_mode is null or push_personality_mode in ('auto', 'stoic', 'friendly', 'coach', 'drill', 'chaos'));
