-- Fase 7: Adaptive Difficulty and Behavior Profiling
-- 7.1.3 Weekly snapshot in weekly_reports; 7.2.3 Extend behavior_patterns.pattern_type

ALTER TABLE public.weekly_reports
  ADD COLUMN IF NOT EXISTS performance_index smallint CHECK (performance_index IS NULL OR (performance_index >= 0 AND performance_index <= 100)),
  ADD COLUMN IF NOT EXISTS avg_rank_numeric numeric(3,2) CHECK (avg_rank_numeric IS NULL OR (avg_rank_numeric >= 1 AND avg_rank_numeric <= 4)),
  ADD COLUMN IF NOT EXISTS consistency_days smallint CHECK (consistency_days IS NULL OR (consistency_days >= 0 AND consistency_days <= 7));

COMMENT ON COLUMN public.weekly_reports.performance_index IS 'Fase 7: 7-day index 0-100';
COMMENT ON COLUMN public.weekly_reports.avg_rank_numeric IS 'S=4, A=3, B=2, C=1';
COMMENT ON COLUMN public.weekly_reports.consistency_days IS 'Days in week with at least 1 completion';

ALTER TABLE public.behavior_patterns DROP CONSTRAINT IF EXISTS behavior_patterns_pattern_type_check;
ALTER TABLE public.behavior_patterns
  ADD CONSTRAINT behavior_patterns_pattern_type_check CHECK (pattern_type IN (
    'missed_after_busy', 'low_study_time', 'inconsistent_weekend',
    'monday_avoidance', 'high_focus_avoidance', 'social_overload', 'cancels_above_threshold'
  ));
