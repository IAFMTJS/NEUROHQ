-- NEUROHQ — Identity Engine: archetypes, reputation, evolution phases, campaigns, friction
-- Run after 026_dcic_gamification_engine.sql

-- 1. User identity engine (archetype + evolution phase)
CREATE TABLE IF NOT EXISTS public.user_identity_engine (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  archetype text NOT NULL DEFAULT 'operator'
    CHECK (archetype IN ('strategist', 'builder', 'warrior', 'monk', 'creator', 'operator')),
  evolution_phase text NOT NULL DEFAULT 'initiate'
    CHECK (evolution_phase IN ('initiate', 'stabilizer', 'optimizer', 'architect', 'master')),
  active_campaign_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_identity_engine ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_identity_engine" ON public.user_identity_engine FOR ALL USING (auth.uid() = user_id);
COMMENT ON TABLE public.user_identity_engine IS 'Identity Engine: archetype and evolution phase';
COMMENT ON COLUMN public.user_identity_engine.archetype IS 'The Strategist, Builder, Warrior, Monk, Creator, Operator';
COMMENT ON COLUMN public.user_identity_engine.evolution_phase IS 'Initiate → Stabilizer → Optimizer → Architect → Master';

-- 2. Reputation (Discipline, Consistency, Impact) — behaviour-based, not just XP
CREATE TABLE IF NOT EXISTS public.user_reputation (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  discipline smallint NOT NULL DEFAULT 0 CHECK (discipline >= 0 AND discipline <= 100),
  consistency smallint NOT NULL DEFAULT 0 CHECK (consistency >= 0 AND consistency <= 100),
  impact smallint NOT NULL DEFAULT 0 CHECK (impact >= 0 AND impact <= 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_reputation" ON public.user_reputation FOR ALL USING (auth.uid() = user_id);
COMMENT ON TABLE public.user_reputation IS 'Reputation: discipline (streak), consistency (30d), impact (high-difficulty)';

-- 3. 90-day campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  theme text NOT NULL CHECK (theme IN ('physical_transformation', 'business_scaling', 'mental_stability', 'custom')),
  started_at date NOT NULL DEFAULT CURRENT_DATE,
  target_end_at date NOT NULL,
  progress_pct smallint NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.campaigns(user_id);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_campaigns" ON public.campaigns FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.user_identity_engine
  ADD CONSTRAINT fk_identity_active_campaign
  FOREIGN KEY (active_campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- 4. Friction detection (opened not started, started not completed, postponed)
CREATE TABLE IF NOT EXISTS public.friction_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  mission_id uuid REFERENCES public.missions(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('opened_not_started', 'started_not_completed', 'postponed')),
  opened_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  delay_minutes int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_friction_events_user_created ON public.friction_events(user_id, created_at);
ALTER TABLE public.friction_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_friction_events" ON public.friction_events FOR ALL USING (auth.uid() = user_id);
COMMENT ON TABLE public.friction_events IS 'Friction detection: resistance, procrastination signals';
