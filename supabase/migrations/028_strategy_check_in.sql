-- NEUROHQ — Strategy check-in (for dashboard reminder: "do a strategy check-in")
-- Run after 027_identity_engine.sql

CREATE TABLE IF NOT EXISTS public.strategy_check_in (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.strategy_check_in ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_strategy_check_in" ON public.strategy_check_in FOR ALL USING (auth.uid() = user_id);
COMMENT ON TABLE public.strategy_check_in IS 'Last strategy check-in date; used to show dashboard reminder when due';
