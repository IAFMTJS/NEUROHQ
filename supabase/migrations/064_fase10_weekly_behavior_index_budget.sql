-- Fase 10: Economic Feedback (Weekly Behavior Index → budget)
-- 10.2.1 weekly_budget_adjustment: outcome per week; only backend writes (RLS: user can SELECT)

CREATE TABLE IF NOT EXISTS public.weekly_budget_adjustment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  behavior_index smallint NOT NULL CHECK (behavior_index >= 0 AND behavior_index <= 100),
  budget_discipline_met boolean NOT NULL DEFAULT true,
  discretionary_change_cents integer NOT NULL DEFAULT 0,
  savings_transfer_cents integer NOT NULL DEFAULT 0,
  recovery_available boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_budget_adjustment_user_week
  ON public.weekly_budget_adjustment(user_id, week_start DESC);

ALTER TABLE public.weekly_budget_adjustment ENABLE ROW LEVEL SECURITY;

-- 10.2.2 User can only read their rows; INSERT/UPDATE only via service role (no policy = no auth insert)
CREATE POLICY "users_read_weekly_budget_adjustment" ON public.weekly_budget_adjustment
  FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE public.weekly_budget_adjustment IS 'Fase 10: weekly outcome from Behavior Index; +€10 discretionary / -€50 savings; only system writes';
