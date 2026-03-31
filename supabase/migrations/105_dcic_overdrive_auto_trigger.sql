-- DCIC Overdrive: auto-trigger tracking (once/day enforcement + debugging).

alter table public.daily_state
  add column if not exists dcic_overdrive_auto_triggered boolean not null default false;

alter table public.daily_state
  add column if not exists dcic_overdrive_trigger_reason text;

alter table public.daily_state
  add column if not exists dcic_overdrive_triggered_at timestamptz;

comment on column public.daily_state.dcic_overdrive_auto_triggered is
  'True when Overdrive was automatically triggered by the system for this local calendar day.';

comment on column public.daily_state.dcic_overdrive_trigger_reason is
  'Machine-readable reason for Overdrive auto trigger (e.g. momentum_combo, streak_rescue, preferred_window).';

comment on column public.daily_state.dcic_overdrive_triggered_at is
  'Timestamp when Overdrive was auto-triggered for this day.';

