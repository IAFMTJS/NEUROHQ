-- Tasks: optional hobby_tag to link missions to hobby commitment (fitness, music, language, creative).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND column_name = 'hobby_tag'
  ) THEN
    ALTER TABLE public.tasks
      ADD COLUMN hobby_tag text
      CHECK (hobby_tag IS NULL OR hobby_tag IN ('fitness', 'music', 'language', 'creative'));
  END IF;
END $$;

COMMENT ON COLUMN public.tasks.hobby_tag IS 'Optional hobby tag for this task: fitness | music | language | creative.';

