-- NEUROHQ — Gevaarlijke modules: identity drift, weekly mode, chaos/scarcity, autopilot, regret, investment

-- 2. Identity Drift snapshot (30–90d indices → derived type)
CREATE TABLE IF NOT EXISTS public.identity_drift_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_end date NOT NULL,
  discipline_index smallint NOT NULL CHECK (discipline_index >= 0 AND discipline_index <= 100),
  volatility_index smallint NOT NULL CHECK (volatility_index >= 0 AND volatility_index <= 100),
  avoidance_index smallint NOT NULL CHECK (avoidance_index >= 0 AND avoidance_index <= 100),
  recovery_dependency_index smallint NOT NULL CHECK (recovery_dependency_index >= 0 AND recovery_dependency_index <= 100),
  social_intensity_index smallint NOT NULL CHECK (social_intensity_index >= 0 AND social_intensity_index <= 100),
  derived_type text NOT NULL CHECK (derived_type IN ('structured_operator', 'volatile_sprinter', 'avoidant_strategist', 'social_executor', 'burnout_cycler')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_end)
);
CREATE INDEX IF NOT EXISTS idx_identity_drift_user_period ON public.identity_drift_snapshot(user_id, period_end DESC);
ALTER TABLE public.identity_drift_snapshot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_identity_drift" ON public.identity_drift_snapshot FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_identity_drift" ON public.identity_drift_snapshot FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_identity_drift" ON public.identity_drift_snapshot FOR UPDATE USING (auth.uid() = user_id);

-- 5. Weekly Tactical Mode
CREATE TABLE IF NOT EXISTS public.weekly_tactical_mode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  mode text NOT NULL CHECK (mode IN ('stability', 'push', 'recovery', 'expansion')),
  user_override_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_weekly_tactical_user_week ON public.weekly_tactical_mode(user_id, week_start DESC);
ALTER TABLE public.weekly_tactical_mode ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_weekly_tactical" ON public.weekly_tactical_mode FOR ALL USING (auth.uid() = user_id);

-- Missions: chaos/scarcity (mission_intent), scarcity expiry
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS mission_intent text CHECK (mission_intent IS NULL OR mission_intent IN ('normal', 'recovery', 'push', 'chaos', 'scarcity')),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;
COMMENT ON COLUMN public.missions.mission_intent IS 'normal|recovery|push|chaos|scarcity for modifiers';
COMMENT ON COLUMN public.missions.expires_at IS 'Scarcity: mission only available until this time';

-- behaviour_log: mission_intent at completion (denormalized from mission)
ALTER TABLE public.behaviour_log
  ADD COLUMN IF NOT EXISTS mission_intent text;
COMMENT ON COLUMN public.behaviour_log.mission_intent IS 'Denormalized: normal|recovery|push|chaos|scarcity';

-- 12. Autopilot
CREATE TABLE IF NOT EXISTS public.autopilot_refusal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  suggested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_autopilot_refusal_user_time ON public.autopilot_refusal(user_id, suggested_at DESC);
ALTER TABLE public.autopilot_refusal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_autopilot_refusal" ON public.autopilot_refusal FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.autopilot_day (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  forced boolean NOT NULL DEFAULT false,
  plan_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_autopilot_day_user_date ON public.autopilot_day(user_id, date DESC);
ALTER TABLE public.autopilot_day ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_autopilot_day" ON public.autopilot_day FOR ALL USING (auth.uid() = user_id);

-- 14. Regret / Missed opportunity (aggregate per type per user; recompute weekly or on completion)
CREATE TABLE IF NOT EXISTS public.missed_opportunity_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mission_type text NOT NULL,
  missed_count smallint NOT NULL DEFAULT 0,
  last_missed_at date,
  completions_same_type smallint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_type)
);
CREATE INDEX IF NOT EXISTS idx_missed_opp_user ON public.missed_opportunity_index(user_id);
ALTER TABLE public.missed_opportunity_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_missed_opportunity" ON public.missed_opportunity_index FOR ALL USING (auth.uid() = user_id);

-- 13. Cognitive Investment: daily_state
ALTER TABLE public.daily_state
  ADD COLUMN IF NOT EXISTS focus_invested_today smallint CHECK (focus_invested_today IS NULL OR (focus_invested_today >= 0 AND focus_invested_today <= 100)),
  ADD COLUMN IF NOT EXISTS invested_mission_id uuid REFERENCES public.missions(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.daily_state.focus_invested_today IS 'Focus invested in 1 mission today; max 1 invested mission per day';
COMMENT ON COLUMN public.daily_state.invested_mission_id IS 'Mission that has invested focus (for double loss on fail)';

-- 15. Real-Life Anchor: weekly_budget_adjustment extensions
ALTER TABLE public.weekly_budget_adjustment
  ADD COLUMN IF NOT EXISTS discretionary_cap_cents integer,
  ADD COLUMN IF NOT EXISTS growth_unlock_eligible boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.weekly_budget_adjustment.discretionary_cap_cents IS 'Cap for discretionary spend this week when set';
COMMENT ON COLUMN public.weekly_budget_adjustment.growth_unlock_eligible IS 'True when behavior index allows growth unlock';
