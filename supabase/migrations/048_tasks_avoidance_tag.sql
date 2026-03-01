-- Tasks: optional avoidance_tag to link missions to avoidance patterns (household, administration, social).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND column_name = 'avoidance_tag'
  ) THEN
    ALTER TABLE public.tasks
      ADD COLUMN avoidance_tag text
      CHECK (avoidance_tag IS NULL OR avoidance_tag IN ('household', 'administration', 'social'));
  END IF;
END $$;

COMMENT ON COLUMN public.tasks.avoidance_tag IS 'Optional avoidance tag for this task: household | administration | social.';

