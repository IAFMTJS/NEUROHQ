-- NEUROHQ — Fase 2 volledig: tasks.difficulty, missions focus_requirement + social_intensity
-- 2.1.1 Tasks: optional difficulty (0.1–1). 2.1.2 Missions: zelfde cost-model velden.

-- Tasks: difficulty (optional summary, 0.1–1)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS difficulty numeric(3,2) CHECK (difficulty IS NULL OR (difficulty >= 0.1 AND difficulty <= 1));

COMMENT ON COLUMN public.tasks.difficulty IS '0.1–1: optional difficulty (Resource & Consequence Engine); null = derive from cognitive_load/energy';

-- Missions: focus_requirement + social_intensity (1–10, same semantics as tasks)
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS focus_requirement smallint CHECK (focus_requirement IS NULL OR (focus_requirement >= 1 AND focus_requirement <= 10)),
  ADD COLUMN IF NOT EXISTS social_intensity smallint CHECK (social_intensity IS NULL OR (social_intensity >= 1 AND social_intensity <= 10));

COMMENT ON COLUMN public.missions.focus_requirement IS '1–10: focus needed (Brain Circle); aligned with tasks.focus_required';
COMMENT ON COLUMN public.missions.social_intensity IS '1–10: social load; aligned with tasks.social_load';
