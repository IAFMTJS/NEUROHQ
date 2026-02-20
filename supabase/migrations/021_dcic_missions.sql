-- NEUROHQ — DCIC Missions System
-- Run after 020_behavior_engine.sql

-- 1. missions table
CREATE TABLE IF NOT EXISTS public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 100 CHECK (xp_reward > 0),
  energy_cost integer NOT NULL DEFAULT 15 CHECK (energy_cost >= 0),
  difficulty_level numeric(3,2) NOT NULL DEFAULT 0.5 CHECK (difficulty_level >= 0.1 AND difficulty_level <= 1.0),
  active boolean NOT NULL DEFAULT false,
  completed boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_missions_user_id ON public.missions(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_user_active ON public.missions(user_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_missions_user_completed ON public.missions(user_id, completed, completed_at);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_missions" ON public.missions
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.missions IS 'DCIC mission system - gamified tasks';
COMMENT ON COLUMN public.missions.difficulty_level IS '0.1 (easy) to 1.0 (hard)';

-- 2. mission_state table (tracks active mission per user)
CREATE TABLE IF NOT EXISTS public.mission_state (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  active_mission_id uuid REFERENCES public.missions(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mission_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_mission_state" ON public.mission_state
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.mission_state IS 'Tracks which mission is currently active per user';

-- 3. behaviour_log table
CREATE TABLE IF NOT EXISTS public.behaviour_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  mission_id uuid REFERENCES public.missions(id) ON DELETE SET NULL,
  mission_started_at timestamptz,
  mission_completed_at timestamptz,
  energy_before integer CHECK (energy_before >= 0 AND energy_before <= 100),
  energy_after integer CHECK (energy_after >= 0 AND energy_after <= 100),
  resisted_before_start boolean NOT NULL DEFAULT false,
  difficulty_level numeric(3,2),
  xp_gained integer CHECK (xp_gained >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_behaviour_log_user_date ON public.behaviour_log(user_id, date);
CREATE INDEX IF NOT EXISTS idx_behaviour_log_user_mission ON public.behaviour_log(user_id, mission_id);

ALTER TABLE public.behaviour_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_behaviour_log" ON public.behaviour_log
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.behaviour_log IS 'DCIC behaviour tracking for pattern detection';

-- 4. achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_achievements" ON public.achievements
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.achievements IS 'DCIC achievement unlocks';

-- 5. user_skills table (for skills system)
CREATE TABLE IF NOT EXISTS public.user_skills (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_key)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);

ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_skills" ON public.user_skills
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_skills IS 'DCIC skills system';

-- 6. user_streak table (for streak tracking)
CREATE TABLE IF NOT EXISTS public.user_streak (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_completion_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streak ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_streak" ON public.user_streak
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_streak IS 'DCIC streak tracking';

-- 7. Function to update mission_state when mission becomes active
CREATE OR REPLACE FUNCTION update_mission_state()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active = true THEN
    -- Set this mission as active
    INSERT INTO public.mission_state (user_id, active_mission_id, updated_at)
    VALUES (NEW.user_id, NEW.id, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET active_mission_id = NEW.id, updated_at = now();
    
    -- Deactivate other missions for this user
    UPDATE public.missions
    SET active = false, updated_at = now()
    WHERE user_id = NEW.user_id AND id != NEW.id AND active = true;
  ELSIF NEW.active = false THEN
    -- Clear mission_state if this was the active mission
    UPDATE public.mission_state
    SET active_mission_id = NULL, updated_at = now()
    WHERE user_id = NEW.user_id AND active_mission_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mission_state_trigger
  AFTER INSERT OR UPDATE OF active ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION update_mission_state();

-- 8. Function to update streak on mission completion
CREATE OR REPLACE FUNCTION update_streak_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  completion_date date;
  last_completion date;
  days_diff integer;
  current_streak_val integer;
  longest_streak_val integer;
BEGIN
  -- Only process if mission was just completed
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    completion_date := COALESCE(NEW.completed_at::date, CURRENT_DATE);
    
    -- Get or create streak record
    INSERT INTO public.user_streak (user_id, current_streak, longest_streak, last_completion_date)
    VALUES (NEW.user_id, 0, 0, NULL)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT last_completion_date, current_streak, longest_streak
    INTO last_completion, current_streak_val, longest_streak_val
    FROM public.user_streak
    WHERE user_id = NEW.user_id;
    
    -- Calculate streak
    IF last_completion IS NULL THEN
      -- First completion
      current_streak_val := 1;
    ELSE
      days_diff := completion_date - last_completion;
      IF days_diff = 1 THEN
        -- Consecutive day
        current_streak_val := current_streak_val + 1;
      ELSIF days_diff > 1 THEN
        -- Streak broken
        current_streak_val := 1;
      END IF;
    END IF;
    
    -- Update longest streak
    IF current_streak_val > longest_streak_val THEN
      longest_streak_val := current_streak_val;
    END IF;
    
    -- Update streak record
    UPDATE public.user_streak
    SET 
      current_streak = current_streak_val,
      longest_streak = longest_streak_val,
      last_completion_date = completion_date,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER streak_update_trigger
  AFTER UPDATE OF completed ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_completion();
