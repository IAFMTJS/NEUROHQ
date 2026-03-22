-- Track which app release "what's new" push the user already received (see lib/app-release.ts).

alter table if exists public.user_preferences
  add column if not exists last_release_push_version text;

comment on column public.user_preferences.last_release_push_version is
  'Matches NEUROHQ_APP_RELEASE_VERSION after user receives the release summary push.';
