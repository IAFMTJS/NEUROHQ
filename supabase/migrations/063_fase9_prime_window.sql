-- Fase 9: Prime Windows (time pressure)
-- Store computed prime window per user from task_events/behaviour_log peak completion time

ALTER TABLE public.user_gamification
  ADD COLUMN IF NOT EXISTS prime_window_start time,
  ADD COLUMN IF NOT EXISTS prime_window_end time;

COMMENT ON COLUMN public.user_gamification.prime_window_start IS 'Fase 9: start of best-focus window; inside: +10% XP, lower failure';
COMMENT ON COLUMN public.user_gamification.prime_window_end IS 'Fase 9: end of prime window (e.g. 2h wide)';
