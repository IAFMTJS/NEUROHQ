-- Strategy engine: user-tunable knobs (missions floors, budget lock caps, savings/growth targets, notification bias).
-- Consumed by energy budget, missions cap, budget locks, and push context.

alter table if exists public.strategy_focus
  add column if not exists engine_params jsonb not null default '{}'::jsonb;

comment on column public.strategy_focus.engine_params is
  'JSON: mission floors by energy band, max budget locks per quarter, quarterly savings/learning targets, push area preferences.';
