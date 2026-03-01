-- Fase 6: Recovery system + Rest day (streak shield)
-- is_rest_day: when true, no streak decay that day (6.2.1, 6.2.3)

ALTER TABLE public.daily_state
  ADD COLUMN IF NOT EXISTS is_rest_day boolean DEFAULT false;

COMMENT ON COLUMN public.daily_state.is_rest_day IS 'Fase 6: planned rest day; streak shield when 0 completions';
