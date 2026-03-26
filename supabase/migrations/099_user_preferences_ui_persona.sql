-- Dashboard HQ persona (per user_id, persisted; replaces local-only storage for sync across devices).
alter table if exists public.user_preferences
  add column if not exists display_callsign text,
  add column if not exists hq_headline text,
  add column if not exists greeting_locale text default 'en';

comment on column public.user_preferences.display_callsign is
  'Short name in HQ greeting (e.g. Commander). Max length enforced in app (24).';
comment on column public.user_preferences.hq_headline is
  'Main HQ title above greeting. Max 40 in app.';
comment on column public.user_preferences.greeting_locale is
  'Time-of-day greeting language: en | nl';

alter table public.user_preferences drop constraint if exists user_preferences_greeting_locale_check;
alter table public.user_preferences
  add constraint user_preferences_greeting_locale_check
  check (greeting_locale is null or greeting_locale in ('en', 'nl'));
