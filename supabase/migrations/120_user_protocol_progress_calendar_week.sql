-- Align protocol "current week" with budget calendar weeks (Mon–Sun) for Growth / Missions auto-roll.

alter table public.user_protocol_progress
  add column if not exists growth_calendar_week_start date null;

comment on column public.user_protocol_progress.growth_calendar_week_start is
  'Monday (YYYY-MM-DD) of the budget week last aligned with current_week_index; used to roll protocol week when the calendar week changes.';
