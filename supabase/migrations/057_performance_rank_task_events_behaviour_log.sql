-- NEUROHQ — Fase 3: Performance Rank (S/A/B/C) on task_events and behaviour_log
-- 3.2.1 Store performance_score (0–100) and performance_rank (S/A/B/C) per completion.

-- task_events: for task completions (Missions page / tasks)
ALTER TABLE public.task_events
  ADD COLUMN IF NOT EXISTS performance_score smallint CHECK (performance_score IS NULL OR (performance_score >= 0 AND performance_score <= 100)),
  ADD COLUMN IF NOT EXISTS performance_rank text CHECK (performance_rank IS NULL OR performance_rank IN ('S', 'A', 'B', 'C'));

COMMENT ON COLUMN public.task_events.performance_score IS '0–100: completion quality (time, energy, focus, consistency)';
COMMENT ON COLUMN public.task_events.performance_rank IS 'S ≥90, A ≥75, B ≥60, C <60 → XP modifier';

-- behaviour_log: for DCIC mission completions
ALTER TABLE public.behaviour_log
  ADD COLUMN IF NOT EXISTS performance_score smallint CHECK (performance_score IS NULL OR (performance_score >= 0 AND performance_score <= 100)),
  ADD COLUMN IF NOT EXISTS performance_rank text CHECK (performance_rank IS NULL OR performance_rank IN ('S', 'A', 'B', 'C'));

COMMENT ON COLUMN public.behaviour_log.performance_score IS '0–100: mission completion quality';
COMMENT ON COLUMN public.behaviour_log.performance_rank IS 'S/A/B/C → XP modifier';
