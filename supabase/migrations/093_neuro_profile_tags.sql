-- NEUROHQ — Optional neurodiversity profile tags for personalization (not medical diagnosis).
-- Data-first: tags drive future copy/telemetry; user-controlled.

ALTER TABLE public.behavior_profile
  ADD COLUMN IF NOT EXISTS neuro_profile_tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.behavior_profile
  ADD COLUMN IF NOT EXISTS neuro_self_report_opt_in boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.behavior_profile.neuro_profile_tags IS 'Optional labels: adhd, add, autism, odd, audhd — for app personalization only.';
COMMENT ON COLUMN public.behavior_profile.neuro_self_report_opt_in IS 'User opts in to quick in-flow self-report prompts (why stopped, focus break).';
