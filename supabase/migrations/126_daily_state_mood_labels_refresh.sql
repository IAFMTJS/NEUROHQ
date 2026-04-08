alter table public.daily_state
  drop constraint if exists daily_state_mood_label_check;

alter table public.daily_state
  add constraint daily_state_mood_label_check
  check (
    mood_label is null
    or mood_label in (
      'overwhelmed',
      'tired',
      'low',
      'sick',
      'physical',
      'hyperfocus',
      'hyperactive',
      'drained_ok',
      'lazy',
      'sunny',
      'introverted_day',
      'extroverted_day',
      'calm',
      'focused',
      'motivated',
      'proud',
      'joyful',
      'good'
    )
  );
