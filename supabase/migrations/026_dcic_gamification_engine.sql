-- NEUROHQ — DCIC Gamification Engine (missions types, user identity, life areas)
-- Run after 025_budget_payday_day.sql

-- 1. Extend missions: type, category (life area), skill_link, recurrence, streak_eligible
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'mission_type') THEN
    ALTER TABLE public.missions ADD COLUMN mission_type text NOT NULL DEFAULT 'routine'
      CHECK (mission_type IN ('routine', 'milestone', 'skill_bound', 'challenge', 'habit'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'category') THEN
    ALTER TABLE public.missions ADD COLUMN category text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'skill_link') THEN
    ALTER TABLE public.missions ADD COLUMN skill_link text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'recurrence_type') THEN
    ALTER TABLE public.missions ADD COLUMN recurrence_type text CHECK (recurrence_type IS NULL OR recurrence_type IN ('daily', 'weekly', 'monthly'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'streak_eligible') THEN
    ALTER TABLE public.missions ADD COLUMN streak_eligible boolean NOT NULL DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN public.missions.mission_type IS 'routine | milestone | skill_bound | challenge | habit';
COMMENT ON COLUMN public.missions.category IS 'Life area: physical, mental, work, social, financial';
COMMENT ON COLUMN public.missions.skill_link IS 'Skill key when mission_type = skill_bound';
COMMENT ON COLUMN public.missions.streak_eligible IS 'Completion counts toward daily streak';

-- energy_cost: keep existing; app uses 1-5 scale and daily cap 10
-- Add check for 1-5 only for new rows if desired (optional):
-- ALTER TABLE public.missions ADD CONSTRAINT missions_energy_cost_1_5 CHECK (energy_cost >= 1 AND energy_cost <= 5);

-- 2. User gamification profile (identity, momentum, streak shield, life areas)
CREATE TABLE IF NOT EXISTS public.user_gamification (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  momentum_score smallint NOT NULL DEFAULT 50 CHECK (momentum_score >= 0 AND momentum_score <= 100),
  rank_title text,
  specialization text,
  streak_shield_used_this_month boolean NOT NULL DEFAULT false,
  life_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_gamification" ON public.user_gamification
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_gamification IS 'DCIC identity: momentum, rank cache, specialization, streak shield, life areas';
COMMENT ON COLUMN public.user_gamification.life_areas IS 'Selected life areas: ["physical","mental","work","social","financial"]';

-- 3. Index for behaviour_log by user+date (already exists), ensure we can aggregate completion for momentum
CREATE INDEX IF NOT EXISTS idx_behaviour_log_user_date_completed ON public.behaviour_log(user_id, date) WHERE mission_completed_at IS NOT NULL;
