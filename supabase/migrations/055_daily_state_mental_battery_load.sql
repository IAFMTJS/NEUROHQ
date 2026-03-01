-- NEUROHQ — Daily Capacity Layer (Brain Circles): mental_battery + load
-- mental_battery = buffer (1–10, user set). load = opgebouwde druk (0–100, system or user).
-- effectiveStress = load - (mental_battery * 5) when using this scale.

ALTER TABLE public.daily_state
  ADD COLUMN IF NOT EXISTS mental_battery smallint CHECK (mental_battery IS NULL OR (mental_battery >= 1 AND mental_battery <= 10)),
  ADD COLUMN IF NOT EXISTS load smallint CHECK (load IS NULL OR (load >= 0 AND load <= 100));

COMMENT ON COLUMN public.daily_state.mental_battery IS '1–10: social/emotional buffer (Brain Circle); higher = more tolerance';
COMMENT ON COLUMN public.daily_state.load IS '0–100: accumulated pressure; used for effectiveStress with mental_battery';
