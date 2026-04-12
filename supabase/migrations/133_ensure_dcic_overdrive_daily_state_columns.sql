-- Ensure DCIC overdrive audit columns exist (idempotent).
-- Safe if migration 105 already ran; fixes projects where 105 was skipped.

alter table public.daily_state
  add column if not exists dcic_overdrive_auto_triggered boolean not null default false;

alter table public.daily_state
  add column if not exists dcic_overdrive_trigger_reason text;

alter table public.daily_state
  add column if not exists dcic_overdrive_triggered_at timestamptz;
