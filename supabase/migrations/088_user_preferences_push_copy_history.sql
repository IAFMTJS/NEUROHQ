-- Push copy dedupe (A.2): remember variant indices per pool to avoid repeats within N days.
alter table if exists public.user_preferences
  add column if not exists push_copy_history jsonb not null default '{}'::jsonb;

comment on column public.user_preferences.push_copy_history is
  'JSON map poolKey -> [{ day: YYYY-MM-DD, index: number }, ...] for notification title/body variant deduplication';
