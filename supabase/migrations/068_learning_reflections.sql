-- NEUROHQ — Learning reflections (Growth page weekly check-in)
-- Used by GrowthReflectionCard and submitLearningReflection.

CREATE TABLE IF NOT EXISTS public.learning_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  understood text,
  difficult text,
  adjust text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_reflections_user_date
  ON public.learning_reflections(user_id, date);

COMMENT ON TABLE public.learning_reflections IS 'Weekly learning reflection entries (understood, difficult, adjust) for Growth page.';

ALTER TABLE public.learning_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_learning_reflections"
  ON public.learning_reflections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
