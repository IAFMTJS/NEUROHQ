-- NEUROHQ — User preferences: usual days off and mode

alter table if exists public.user_preferences
  add column if not exists usual_days_off smallint[]
    check (
      usual_days_off is null
      or array_length(usual_days_off, 1) between 0 and 7
    ),
  add column if not exists day_off_mode text
    check (day_off_mode is null or day_off_mode in ('soft', 'hard'));

comment on column public.user_preferences.usual_days_off is
  'Optional ISO weekday list (1=Mon..7=Sun) treated as typical days off for scheduling bias.';

comment on column public.user_preferences.day_off_mode is
  'When "soft", days off bias suggestions toward recovery/household; when "hard", avoid work-like missions unless explicitly added.';

