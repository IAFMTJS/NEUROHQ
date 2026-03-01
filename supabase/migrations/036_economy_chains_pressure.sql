-- NEUROHQ — Economy (Discipline Points, Focus Credits, Momentum Boosters) + Mission Chains + Pressure state + fatigue
-- Run after 035_emotional_state_resistance.sql

-- 1. User economy (naast XP)
CREATE TABLE IF NOT EXISTS public.user_economy (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  discipline_points integer NOT NULL DEFAULT 0 CHECK (discipline_points >= 0),
  focus_credits integer NOT NULL DEFAULT 0 CHECK (focus_credits >= 0),
  momentum_boosters integer NOT NULL DEFAULT 0 CHECK (momentum_boosters >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_economy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_economy" ON public.user_economy FOR ALL USING (auth.uid() = user_id);
COMMENT ON TABLE public.user_economy IS 'Economy beside XP: Discipline Points, Focus Credits, Momentum Boosters';

-- 2. Mission chains (campaigns)
CREATE TABLE IF NOT EXISTS public.mission_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  alignment_bonus_pct smallint NOT NULL DEFAULT 10 CHECK (alignment_bonus_pct >= 0 AND alignment_bonus_pct <= 50),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mission_chain_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id uuid NOT NULL REFERENCES public.mission_chains(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  step_order smallint NOT NULL CHECK (step_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chain_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_mission_chains_user ON public.mission_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_chain_steps_chain ON public.mission_chain_steps(chain_id);

ALTER TABLE public.mission_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_chain_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_mission_chains" ON public.mission_chains FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_chain_steps" ON public.mission_chain_steps FOR ALL
  USING (EXISTS (SELECT 1 FROM public.mission_chains c WHERE c.id = chain_id AND c.user_id = auth.uid()));

COMMENT ON TABLE public.mission_chains IS 'Mission campaigns; completion gives alignment bonus';
COMMENT ON TABLE public.mission_chain_steps IS 'Steps (tasks) in a chain; order by step_order';

-- 3. Link tasks to chain (optional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'mission_chain_id') THEN
    ALTER TABLE public.tasks ADD COLUMN mission_chain_id uuid REFERENCES public.mission_chains(id) ON DELETE SET NULL;
  END IF;
END $$;
COMMENT ON COLUMN public.tasks.mission_chain_id IS 'Optional: task belongs to this chain';

-- 4. Strategy: pressure boost after missed deadline (explicit state)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'strategy_focus' AND column_name = 'pressure_boost_after_deadline') THEN
    ALTER TABLE public.strategy_focus ADD COLUMN pressure_boost_after_deadline boolean NOT NULL DEFAULT false;
  END IF;
END $$;
COMMENT ON COLUMN public.strategy_focus.pressure_boost_after_deadline IS 'Set when deadline was missed; next cycle pressure rises';

-- 5. fatigue_impact on tasks (Mission DNA)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'fatigue_impact') THEN
    ALTER TABLE public.tasks ADD COLUMN fatigue_impact numeric(3,2) CHECK (fatigue_impact IS NULL OR (fatigue_impact >= 0 AND fatigue_impact <= 1));
  END IF;
END $$;
COMMENT ON COLUMN public.tasks.fatigue_impact IS '0-1: how much fatigue affects this task';
