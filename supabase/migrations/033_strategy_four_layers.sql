-- NEUROHQ — Strategy 4 Layers: Direction, Allocation, Accountability, Pressure & Adaptation
-- Run after 032_insights_daily_metrics_mission_events.sql
-- Tables: strategy_focus, alignment_log, strategy_review; missions.domain for XP-by-domain

-- 1. Domains for strategy (Discipline, Health, Learning, Business)
-- Add domain to missions so XP can be attributed per domain
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'domain') THEN
    ALTER TABLE public.missions ADD COLUMN domain text
      CHECK (domain IS NULL OR domain IN ('discipline', 'health', 'learning', 'business'));
  END IF;
END $$;
COMMENT ON COLUMN public.missions.domain IS 'Strategy domain for focus allocation: discipline, health, learning, business';

-- 2. strategy_focus (active strategic thesis per user; one active at a time)
CREATE TABLE IF NOT EXISTS public.strategy_focus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  thesis text NOT NULL,
  thesis_why text,
  deadline date NOT NULL,
  target_metric text,
  primary_domain text NOT NULL CHECK (primary_domain IN ('discipline', 'health', 'learning', 'business')),
  secondary_domains jsonb NOT NULL DEFAULT '[]'::jsonb,
  weekly_allocation jsonb NOT NULL DEFAULT '{"discipline":25,"health":25,"learning":25,"business":25}'::jsonb,
  phase text NOT NULL DEFAULT 'accumulation'
    CHECK (phase IN ('accumulation', 'intensification', 'optimization', 'stabilization')),
  identity_profile text NOT NULL DEFAULT 'operator'
    CHECK (identity_profile IN ('commander', 'builder', 'operator', 'athlete', 'scholar')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strategy_focus_user_active ON public.strategy_focus(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_strategy_focus_user ON public.strategy_focus(user_id);
ALTER TABLE public.strategy_focus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_strategy_focus" ON public.strategy_focus FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.strategy_focus IS '4-layer strategy: thesis, focus domains, allocation, phase, identity';
COMMENT ON COLUMN public.strategy_focus.weekly_allocation IS 'Focus points per domain (discipline, health, learning, business); must sum to 100';
COMMENT ON COLUMN public.strategy_focus.secondary_domains IS 'Array of 0–2 domains: ["health","learning"]';
COMMENT ON COLUMN public.strategy_focus.phase IS 'accumulation | intensification | optimization | stabilization';

-- 3. alignment_log (daily planned vs actual distribution; alignment score)
CREATE TABLE IF NOT EXISTS public.alignment_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES public.strategy_focus(id) ON DELETE CASCADE,
  date date NOT NULL,
  planned_distribution jsonb NOT NULL,
  actual_distribution jsonb NOT NULL,
  alignment_score numeric(4,2) NOT NULL CHECK (alignment_score >= 0 AND alignment_score <= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(strategy_id, date)
);

CREATE INDEX IF NOT EXISTS idx_alignment_log_strategy_date ON public.alignment_log(strategy_id, date DESC);
ALTER TABLE public.alignment_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_alignment_via_strategy" ON public.alignment_log FOR ALL
  USING (EXISTS (SELECT 1 FROM public.strategy_focus s WHERE s.id = strategy_id AND s.user_id = auth.uid()));

COMMENT ON TABLE public.alignment_log IS 'Daily planned vs actual XP distribution; alignment = 1 - (sum|planned-actual|/2)';
COMMENT ON COLUMN public.alignment_log.alignment_score IS '0–1; 0.85+ sharp, 0.7–0.85 light drift, <0.7 focus lost';

-- 4. strategy_review (weekly review; required every 7 days to keep strategy active)
CREATE TABLE IF NOT EXISTS public.strategy_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES public.strategy_focus(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  week_start date NOT NULL,
  alignment_score numeric(4,2),
  biggest_drift_domain text,
  strongest_domain text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(strategy_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_strategy_review_strategy ON public.strategy_review(strategy_id, week_number DESC);
ALTER TABLE public.strategy_review ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_review_via_strategy" ON public.strategy_review FOR ALL
  USING (EXISTS (SELECT 1 FROM public.strategy_focus s WHERE s.id = strategy_id AND s.user_id = auth.uid()));

COMMENT ON TABLE public.strategy_review IS 'Weekly strategy review: alignment, drift, strongest domain; required every 7 days';

-- 5. strategy_archive: end_date set when user closes strategy; keep for archive view (use strategy_focus with is_active = false / end_date set)
-- No extra table; archive = strategy_focus WHERE is_active = false OR end_date IS NOT NULL
