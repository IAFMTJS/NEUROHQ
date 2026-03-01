-- NEUROHQ — Task brain circle: focus_required (1–10) for 3-input cost model
-- Energy (energy_required), Focus (focus_required), Load (mental_load) so system can suggest e.g. 4 low-focus tasks vs 2 high-focus.

alter table public.tasks
  add column if not exists focus_required smallint check (focus_required is null or (focus_required >= 1 and focus_required <= 10));

comment on column public.tasks.focus_required is '1–10: focus needed for this task (brain circle); with energy_required and mental_load used for capacity.';
