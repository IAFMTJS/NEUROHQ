-- NEUROHQ — Missions Performance Engine: tasks as strategic missions
-- Run after 033_strategy_four_layers.sql
-- Adds: task domain + Mission DNA, task_events for friction/stats, mission_user_stats view

-- 1. Strategy domain on tasks (align with strategy_focus domains)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'domain') THEN
    ALTER TABLE public.tasks ADD COLUMN domain text
      CHECK (domain IS NULL OR domain IN ('discipline', 'health', 'learning', 'business'));
  END IF;
END $$;
COMMENT ON COLUMN public.tasks.domain IS 'Strategy domain: discipline, health, learning, business (for alignment %)';

-- 2. Mission DNA on tasks (cognitive load, emotional resistance, energy cost, strategic value)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'cognitive_load') THEN
    ALTER TABLE public.tasks ADD COLUMN cognitive_load numeric(3,2) CHECK (cognitive_load IS NULL OR (cognitive_load >= 0.1 AND cognitive_load <= 1));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'emotional_resistance') THEN
    ALTER TABLE public.tasks ADD COLUMN emotional_resistance numeric(3,2) CHECK (emotional_resistance IS NULL OR (emotional_resistance >= 0 AND emotional_resistance <= 1));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'discipline_weight') THEN
    ALTER TABLE public.tasks ADD COLUMN discipline_weight numeric(3,2) CHECK (discipline_weight IS NULL OR (discipline_weight >= 0 AND discipline_weight <= 1));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'strategic_value') THEN
    ALTER TABLE public.tasks ADD COLUMN strategic_value numeric(3,2) CHECK (strategic_value IS NULL OR (strategic_value >= 0 AND strategic_value <= 1));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'psychology_label') THEN
    ALTER TABLE public.tasks ADD COLUMN psychology_label text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'mission_intent') THEN
    ALTER TABLE public.tasks ADD COLUMN mission_intent text CHECK (mission_intent IS NULL OR mission_intent IN ('discipline', 'recovery', 'pressure', 'alignment', 'experiment'));
  END IF;
END $$;
COMMENT ON COLUMN public.tasks.cognitive_load IS '0.1–1: Mission DNA cognitive load';
COMMENT ON COLUMN public.tasks.emotional_resistance IS '0–1: Mission DNA emotional resistance';
COMMENT ON COLUMN public.tasks.discipline_weight IS '0–1: discipline impact weight';
COMMENT ON COLUMN public.tasks.strategic_value IS '0–1: strategic value for thesis';
COMMENT ON COLUMN public.tasks.psychology_label IS 'e.g. Avoidance Breaker, Momentum Booster, Fear Confronter';
COMMENT ON COLUMN public.tasks.mission_intent IS 'Intent: discipline, recovery, pressure, alignment, experiment';

-- 3. Task events (view → start → complete | abandon) for hesitation, completion rate, ROI
CREATE TABLE IF NOT EXISTS public.task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view', 'start', 'complete', 'abandon')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  duration_before_start_seconds integer CHECK (duration_before_start_seconds IS NULL OR duration_before_start_seconds >= 0),
  duration_to_complete_seconds integer CHECK (duration_to_complete_seconds IS NULL OR duration_to_complete_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_events_user_occurred ON public.task_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_events_task ON public.task_events(task_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_task_events_user_type ON public.task_events(user_id, event_type);

ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_task_events" ON public.task_events;
CREATE POLICY "users_own_task_events" ON public.task_events FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.task_events IS 'Task lifecycle events for resistance index, completion rate, ROI';

-- 4. mission_user_stats: per-user per-mission aggregates (for DCIC missions)
-- View from mission_events + behaviour_log for completion_rate, hesitation_time, avg_time, ROI
CREATE OR REPLACE VIEW public.mission_user_stats AS
SELECT
  me.user_id,
  me.mission_id,
  COUNT(*) FILTER (WHERE me.event_type = 'complete')::float / NULLIF(COUNT(*) FILTER (WHERE me.event_type IN ('start', 'complete', 'abandon')), 0) AS completion_rate,
  AVG(me.duration_before_start_seconds) FILTER (WHERE me.event_type = 'start') AS hesitation_time_avg,
  AVG(me.duration_to_complete_seconds) FILTER (WHERE me.event_type = 'complete') AS avg_time_seconds,
  NULL::numeric AS roi
FROM public.mission_events me
GROUP BY me.user_id, me.mission_id;

COMMENT ON VIEW public.mission_user_stats IS 'Per-user per-mission: completion_rate, hesitation_time, avg_time (ROI computed in app)';

-- 5. task_user_stats: per-user per-task aggregates (for tasks-as-missions)
CREATE OR REPLACE VIEW public.task_user_stats AS
SELECT
  te.user_id,
  te.task_id,
  COUNT(*) FILTER (WHERE te.event_type = 'complete')::float / NULLIF(COUNT(*) FILTER (WHERE te.event_type IN ('start', 'complete', 'abandon')), 0) AS completion_rate,
  AVG(te.duration_before_start_seconds) FILTER (WHERE te.event_type = 'start') AS hesitation_time_avg,
  AVG(te.duration_to_complete_seconds) FILTER (WHERE te.event_type = 'complete') AS avg_time_seconds
FROM public.task_events te
GROUP BY te.user_id, te.task_id;

COMMENT ON VIEW public.task_user_stats IS 'Per-user per-task: completion_rate, hesitation_time, avg_time for UMS/friction';
