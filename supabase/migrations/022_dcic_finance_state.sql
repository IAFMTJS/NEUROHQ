-- NEUROHQ — DCIC Finance State Integration
-- Run after 021_dcic_missions.sql

-- 1. income_sources table (for tracking income sources)
CREATE TABLE IF NOT EXISTS public.income_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  day_of_month smallint NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  type text NOT NULL CHECK (type IN ('monthly', 'weekly', 'biweekly')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_income_sources_user ON public.income_sources(user_id);

ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_income_sources" ON public.income_sources
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.income_sources IS 'DCIC income sources for payday-based cycle';

-- 2. budget_targets table (for category-based budget targets)
CREATE TABLE IF NOT EXISTS public.budget_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  target_cents integer NOT NULL CHECK (target_cents >= 0),
  priority smallint NOT NULL CHECK (priority >= 1 AND priority <= 3),
  flexible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_budget_targets_user ON public.budget_targets(user_id);

ALTER TABLE public.budget_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_budget_targets" ON public.budget_targets
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.budget_targets IS 'DCIC budget targets per category';

-- 3. Add recurring flag to budget_entries (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'budget_entries' AND column_name = 'recurring'
  ) THEN
    ALTER TABLE public.budget_entries
    ADD COLUMN recurring boolean NOT NULL DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN public.budget_entries.recurring IS 'True if this is a recurring expense (subscription, etc.)';

-- 4. financial_discipline_score table (for tracking discipline over time)
CREATE TABLE IF NOT EXISTS public.financial_discipline_score (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_financial_discipline_score_user_date ON public.financial_discipline_score(user_id, date);

ALTER TABLE public.financial_discipline_score ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_financial_discipline_score" ON public.financial_discipline_score
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.financial_discipline_score IS 'DCIC financial discipline score history';
