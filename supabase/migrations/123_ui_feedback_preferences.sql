-- In-app UI sounds and optional speech (Web Audio / Speech Synthesis), user-controlled.

alter table public.user_preferences
  add column if not exists ui_sound_enabled boolean not null default true,
  add column if not exists ui_speech_enabled boolean not null default false;

comment on column public.user_preferences.ui_sound_enabled is 'When true, play short UI sounds (errors, success, nudges) in the web/PWA app.';
comment on column public.user_preferences.ui_speech_enabled is 'When true, speak optional reinforcement lines (e.g. budget) via Web Speech API.';
