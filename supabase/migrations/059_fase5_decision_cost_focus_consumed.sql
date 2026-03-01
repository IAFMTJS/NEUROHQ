-- Fase 5: Decision Cost — focus consumed when starting heavy mission (5.2.2)
-- focus_consumed: deducted from effective focus for capacity (1–10 scale, so -5 = half slot).

ALTER TABLE public.daily_state
  ADD COLUMN IF NOT EXISTS focus_consumed smallint DEFAULT 0 CHECK (focus_consumed IS NULL OR (focus_consumed >= 0 AND focus_consumed <= 10));

COMMENT ON COLUMN public.daily_state.focus_consumed IS 'Fase 5: focus deducted when starting heavy mission (-5 per start); effective focus = focus - focus_consumed';
