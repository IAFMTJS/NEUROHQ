-- NEUROHQ — Emotional state (pre-start) for Psychological layer
-- Run after 034_missions_performance_engine.sql

ALTER TABLE public.daily_state
  ADD COLUMN IF NOT EXISTS emotional_state text
  CHECK (emotional_state IS NULL OR emotional_state IN ('focused', 'tired', 'resistance', 'distracted', 'motivated'));

COMMENT ON COLUMN public.daily_state.emotional_state IS 'Pre-start emotional state: focused, tired, resistance, distracted, motivated';
