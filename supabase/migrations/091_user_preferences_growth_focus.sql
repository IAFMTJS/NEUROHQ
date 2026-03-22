-- Growth command center: which protocol trajectory is the user's active focus (Learning / Missions).
alter table if exists public.user_preferences
  add column if not exists growth_focus_protocol_slug text null,
  add column if not exists growth_focus_protocol_locale text null default 'nl';

comment on column public.user_preferences.growth_focus_protocol_slug is
  'Optional protocol_library.slug — user''s chosen Growth focus trajectory.';
comment on column public.user_preferences.growth_focus_protocol_locale is
  'Locale for growth_focus_protocol_slug (matches protocol_library.locale).';
