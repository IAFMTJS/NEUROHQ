-- Fase 8: Meta-progression (Recruit to Commander)
-- 8.2.1 progression_rank in user_gamification

ALTER TABLE public.user_gamification
  ADD COLUMN IF NOT EXISTS progression_rank text NOT NULL DEFAULT 'recruit'
  CHECK (progression_rank IN ('recruit', 'operator', 'specialist', 'commander'));

COMMENT ON COLUMN public.user_gamification.progression_rank IS 'Fase 8: meta-progression ladder; determines penalties, energy impact, XP, delegation, budget rules';
