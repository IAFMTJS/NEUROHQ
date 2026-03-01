-- Fase 4: Daily obligation — track whether zero-completion penalty was applied for a day
-- (load +10, energy -10% applied once at start of day when yesterday had 0 completions)

ALTER TABLE public.daily_state
  ADD COLUMN IF NOT EXISTS zero_completion_penalty_applied boolean DEFAULT false;

COMMENT ON COLUMN public.daily_state.zero_completion_penalty_applied IS 'Fase 4: true when load+10 and energy-10% were applied for 0 completions yesterday';
