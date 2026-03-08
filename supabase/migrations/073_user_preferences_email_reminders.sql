-- NEUROHQ — App reminder emails (daily quote, morning/evening digest, weekly learning).
-- Run after 072_budget_entries_detail_name.sql (or latest user_preferences migration).
-- Default true: email reminders are on by default; user can turn off in Settings.

alter table if exists public.user_preferences
  add column if not exists email_reminders_enabled boolean not null default true;

comment on column public.user_preferences.email_reminders_enabled is
  'When true, user receives app reminder emails (morning/evening digest, weekly learning reminder) via Resend. Default on. Requires RESEND_API_KEY and EMAIL_FROM.';
