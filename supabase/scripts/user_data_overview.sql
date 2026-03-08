-- =============================================================================
-- NEUROHQ — Full Supabase data overview for a single user
-- Purpose: Audit all data stored for this user to find double/unneeded data
--         and see if the site can use the same tables instead of loading twice.
--
-- User ID: b7fc6c46-b8ca-41f4-8ece-938a34d014de
--
-- How to run: Supabase Dashboard → SQL Editor → paste the WHOLE file → Run.
--   Supabase shows only the last result set. The last statement in this file is
--   the combined "everything" query, so you get one result with columns:
--   table_name | row_ordinal | row_data (JSON for each row from every table).
--   To get row counts only, run only section "1. ROW COUNT SUMMARY".
-- =============================================================================

-- All queries use the UUID literal below. To audit another user, find-replace
-- 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' with that user's id.

-- =============================================================================
-- 1. ROW COUNT SUMMARY — One result set: table name + row count for this user
--    Use this to quickly see which tables hold data and spot duplication candidates.
-- =============================================================================
SELECT 'users' AS table_name, count(*) AS row_count FROM public.users WHERE id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'accountability_settings', count(*) FROM public.accountability_settings WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'achievements', count(*) FROM public.achievements WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'alternatives', count(*) FROM public.alternatives WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'analytics_events', count(*) FROM public.analytics_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'assistant_conversation_turn', count(*) FROM public.assistant_conversation_turn WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'assistant_feature_flags', count(*) FROM public.assistant_feature_flags WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'assistant_user_context', count(*) FROM public.assistant_user_context WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'autopilot_day', count(*) FROM public.autopilot_day WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'autopilot_refusal', count(*) FROM public.autopilot_refusal WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'avoidance_tracker', count(*) FROM public.avoidance_tracker WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'behavior_patterns', count(*) FROM public.behavior_patterns WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'behavior_profile', count(*) FROM public.behavior_profile WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'behaviour_log', count(*) FROM public.behaviour_log WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'budget_entries', count(*) FROM public.budget_entries WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'budget_entries_archive', count(*) FROM public.budget_entries_archive WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'budget_targets', count(*) FROM public.budget_targets WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'calendar_events', count(*) FROM public.calendar_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'campaigns', count(*) FROM public.campaigns WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'daily_state', count(*) FROM public.daily_state WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'daily_explanations', count(*) FROM public.daily_explanations WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'education_options', count(*) FROM public.education_options WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'escalation_logs', count(*) FROM public.escalation_logs WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'feature_flags', count(*) FROM public.feature_flags WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'financial_discipline_score', count(*) FROM public.financial_discipline_score WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'friction_events', count(*) FROM public.friction_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'identity_drift_snapshot', count(*) FROM public.identity_drift_snapshot WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'identity_events', count(*) FROM public.identity_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'income_sources', count(*) FROM public.income_sources WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'learning_sessions', count(*) FROM public.learning_sessions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'mission_chains', count(*) FROM public.mission_chains WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'mission_events', count(*) FROM public.mission_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'missed_opportunity_index', count(*) FROM public.missed_opportunity_index WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'mission_state', count(*) FROM public.mission_state WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'missions', count(*) FROM public.missions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'monthly_books', count(*) FROM public.monthly_books WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'pending_xp_notifications', count(*) FROM public.pending_xp_notifications WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'quarterly_strategy', count(*) FROM public.quarterly_strategy WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'reality_reports', count(*) FROM public.reality_reports WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'recurring_budget_templates', count(*) FROM public.recurring_budget_templates WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'savings_contributions', count(*) FROM public.savings_contributions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'savings_goals', count(*) FROM public.savings_goals WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'strategy_check_in', count(*) FROM public.strategy_check_in WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'strategy_focus', count(*) FROM public.strategy_focus WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'strategy_key_results', count(*) FROM public.strategy_key_results WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'task_events', count(*) FROM public.task_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'tasks', count(*) FROM public.tasks WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'user_analytics_daily', count(*) FROM public.user_analytics_daily WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'user_behavior', count(*) FROM public.user_behavior WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'user_category_limits', count(*) FROM public.user_category_limits WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'user_gamification', count(*) FROM public.user_gamification WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'user_google_tokens', count(*) FROM public.user_google_tokens WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'user_identity_engine', count(*) FROM public.user_identity_engine WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'user_preferences', count(*) FROM public.user_preferences WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'user_reputation', count(*) FROM public.user_reputation WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'user_skills', count(*) FROM public.user_skills WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'user_streak', count(*) FROM public.user_streak WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'user_xp', count(*) FROM public.user_xp WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'weekly_budget_adjustment', count(*) FROM public.weekly_budget_adjustment WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'weekly_reports', count(*) FROM public.weekly_reports WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
UNION ALL SELECT 'xp_events', count(*) FROM public.xp_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
ORDER BY table_name;

-- =============================================================================
-- 1b. EVERYTHING IN ONE RESULT SET — Run ONLY this query to get all user data
--     on one "page". Columns: table_name, row_ordinal, row_data (JSON).
--     Supabase only shows the last result when you run multiple statements,
--     so run this query BY ITSELF (select from "-- 1b" down to the next "-- ====").
-- =============================================================================
SELECT table_name, row_ordinal, row_data FROM (
  SELECT 'users' AS table_name, row_number() OVER () AS row_ordinal, to_jsonb(x) AS row_data FROM (SELECT * FROM public.users WHERE id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'accountability_settings', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.accountability_settings WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'achievements', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.achievements WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'alternatives', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.alternatives WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'analytics_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.analytics_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500) x
  UNION ALL SELECT 'assistant_conversation_turn', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.assistant_conversation_turn WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'assistant_feature_flags', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.assistant_feature_flags WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'assistant_user_context', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.assistant_user_context WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'autopilot_day', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.autopilot_day WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'autopilot_refusal', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.autopilot_refusal WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'avoidance_tracker', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.avoidance_tracker WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'behavior_patterns', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.behavior_patterns WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'behavior_profile', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.behavior_profile WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'behaviour_log', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.behaviour_log WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC, created_at DESC LIMIT 500) x
  UNION ALL SELECT 'budget_entries', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.budget_entries WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC, created_at DESC LIMIT 500) x
  UNION ALL SELECT 'budget_entries_archive', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.budget_entries_archive WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY archived_at DESC LIMIT 500) x
  UNION ALL SELECT 'budget_targets', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.budget_targets WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'calendar_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.calendar_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY start_at DESC LIMIT 500) x
  UNION ALL SELECT 'campaigns', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.campaigns WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'daily_state', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.daily_state WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC LIMIT 365) x
  UNION ALL SELECT 'daily_explanations', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.daily_explanations WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'education_options', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.education_options WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'escalation_logs', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.escalation_logs WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'feature_flags', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.feature_flags WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'financial_discipline_score', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.financial_discipline_score WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'friction_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.friction_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500) x
  UNION ALL SELECT 'identity_drift_snapshot', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.identity_drift_snapshot WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'identity_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.identity_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'income_sources', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.income_sources WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'learning_sessions', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.learning_sessions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC LIMIT 500) x
  UNION ALL SELECT 'mission_chains', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.mission_chains WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'mission_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.mission_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY occurred_at DESC LIMIT 500) x
  UNION ALL SELECT 'missed_opportunity_index', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.missed_opportunity_index WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'mission_state', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.mission_state WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'missions', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.missions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500) x
  UNION ALL SELECT 'monthly_books', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.monthly_books WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'pending_xp_notifications', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.pending_xp_notifications WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'quarterly_strategy', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.quarterly_strategy WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'reality_reports', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.reality_reports WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'recurring_budget_templates', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.recurring_budget_templates WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'savings_contributions', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.savings_contributions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'savings_goals', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.savings_goals WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'strategy_check_in', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.strategy_check_in WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'strategy_focus', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.strategy_focus WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'strategy_key_results', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.strategy_key_results WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'strategy_review', row_number() OVER (), to_jsonb(x) FROM (SELECT sr.* FROM public.strategy_review sr JOIN public.strategy_focus sf ON sf.id = sr.strategy_id WHERE sf.user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'alignment_log', row_number() OVER (), to_jsonb(x) FROM (SELECT al.* FROM public.alignment_log al JOIN public.strategy_focus sf ON sf.id = al.strategy_id WHERE sf.user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'mission_chain_steps', row_number() OVER (), to_jsonb(x) FROM (SELECT mcs.* FROM public.mission_chain_steps mcs JOIN public.mission_chains mc ON mc.id = mcs.chain_id WHERE mc.user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'task_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.task_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY occurred_at DESC LIMIT 500) x
  UNION ALL SELECT 'tasks', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.tasks WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY due_date DESC NULLS LAST, created_at DESC LIMIT 500) x
  UNION ALL SELECT 'user_analytics_daily', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_analytics_daily WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC LIMIT 365) x
  UNION ALL SELECT 'user_behavior', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_behavior WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_category_limits', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_category_limits WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_gamification', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_gamification WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_google_tokens', row_number() OVER (), to_jsonb(x) AS row_data FROM (SELECT user_id, created_at, updated_at, expires_at FROM public.user_google_tokens WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_identity_engine', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_identity_engine WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_preferences', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_preferences WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_reputation', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_reputation WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_skills', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_skills WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_streak', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_streak WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_xp', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_xp WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'weekly_budget_adjustment', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.weekly_budget_adjustment WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'weekly_reports', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.weekly_reports WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY week_end DESC LIMIT 104) x
  UNION ALL SELECT 'xp_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.xp_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500) x
) all_data
ORDER BY table_name, row_ordinal;

-- =============================================================================
-- 2. DETAILED DATA — Full rows per table (run each block for full detail)
-- =============================================================================

-- ----- users (profile row; id = user id) -----
SELECT * FROM public.users WHERE id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- accountability_settings -----
SELECT * FROM public.accountability_settings WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- achievements -----
SELECT * FROM public.achievements WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY unlocked_at DESC;

-- ----- alternatives -----
SELECT * FROM public.alternatives WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- analytics_events -----
SELECT * FROM public.analytics_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500;

-- ----- assistant_conversation_turn -----
SELECT * FROM public.assistant_conversation_turn WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- assistant_feature_flags -----
SELECT * FROM public.assistant_feature_flags WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- assistant_user_context -----
SELECT * FROM public.assistant_user_context WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC;

-- ----- autopilot_day -----
SELECT * FROM public.autopilot_day WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC;

-- ----- autopilot_refusal -----
SELECT * FROM public.autopilot_refusal WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- avoidance_tracker -----
SELECT * FROM public.avoidance_tracker WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- behavior_patterns -----
SELECT * FROM public.behavior_patterns WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY detected_at DESC;

-- ----- behavior_profile -----
SELECT * FROM public.behavior_profile WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- behaviour_log -----
SELECT * FROM public.behaviour_log WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC, created_at DESC LIMIT 500;

-- ----- budget_entries -----
SELECT * FROM public.budget_entries WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC, created_at DESC LIMIT 500;

-- ----- budget_entries_archive -----
SELECT * FROM public.budget_entries_archive WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY archived_at DESC LIMIT 500;

-- ----- budget_targets -----
SELECT * FROM public.budget_targets WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- calendar_events -----
SELECT * FROM public.calendar_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY start_at DESC LIMIT 500;

-- ----- campaigns -----
SELECT * FROM public.campaigns WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY started_at DESC;

-- ----- daily_state -----
SELECT * FROM public.daily_state WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC LIMIT 365;

-- ----- daily_explanations -----
SELECT * FROM public.daily_explanations WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC;

-- ----- education_options -----
SELECT * FROM public.education_options WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- escalation_logs -----
SELECT * FROM public.escalation_logs WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC;

-- ----- feature_flags -----
SELECT * FROM public.feature_flags WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- financial_discipline_score -----
SELECT * FROM public.financial_discipline_score WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC;

-- ----- friction_events -----
SELECT * FROM public.friction_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500;

-- ----- identity_drift_snapshot -----
SELECT * FROM public.identity_drift_snapshot WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY period_end DESC;

-- ----- identity_events -----
SELECT * FROM public.identity_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC;

-- ----- income_sources -----
SELECT * FROM public.income_sources WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- learning_sessions -----
SELECT * FROM public.learning_sessions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC LIMIT 500;

-- ----- mission_chains -----
SELECT * FROM public.mission_chains WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC;

-- ----- mission_events -----
SELECT * FROM public.mission_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY occurred_at DESC LIMIT 500;

-- ----- missed_opportunity_index -----
SELECT * FROM public.missed_opportunity_index WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- mission_state -----
SELECT * FROM public.mission_state WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- missions -----
SELECT * FROM public.missions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500;

-- ----- monthly_books -----
SELECT * FROM public.monthly_books WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY year DESC, month DESC;

-- ----- pending_xp_notifications -----
SELECT * FROM public.pending_xp_notifications WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- quarterly_strategy -----
SELECT * FROM public.quarterly_strategy WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY year DESC, quarter DESC;

-- ----- reality_reports -----
SELECT * FROM public.reality_reports WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY week_start DESC;

-- ----- recurring_budget_templates -----
SELECT * FROM public.recurring_budget_templates WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- savings_contributions -----
SELECT * FROM public.savings_contributions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY contributed_at DESC;

-- ----- savings_goals -----
SELECT * FROM public.savings_goals WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- strategy_check_in -----
SELECT * FROM public.strategy_check_in WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY checked_at DESC;

-- ----- strategy_focus -----
SELECT * FROM public.strategy_focus WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY start_date DESC;

-- ----- strategy_key_results -----
SELECT * FROM public.strategy_key_results WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY sort_order;

-- ----- task_events -----
SELECT * FROM public.task_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY occurred_at DESC LIMIT 500;

-- ----- tasks -----
SELECT * FROM public.tasks WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY due_date DESC NULLS LAST, created_at DESC LIMIT 500;

-- ----- user_analytics_daily -----
SELECT * FROM public.user_analytics_daily WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC LIMIT 365;

-- ----- user_behavior -----
SELECT * FROM public.user_behavior WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- user_category_limits -----
SELECT * FROM public.user_category_limits WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- user_gamification -----
SELECT * FROM public.user_gamification WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- user_google_tokens (sensitive: access_token/refresh_token omitted) -----
SELECT user_id, created_at, updated_at, expires_at FROM public.user_google_tokens WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- user_identity_engine -----
SELECT * FROM public.user_identity_engine WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- user_preferences -----
SELECT * FROM public.user_preferences WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- user_reputation -----
SELECT * FROM public.user_reputation WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- user_skills -----
SELECT * FROM public.user_skills WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY unlocked_at DESC;

-- ----- user_streak -----
SELECT * FROM public.user_streak WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- user_xp -----
SELECT * FROM public.user_xp WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de';

-- ----- weekly_budget_adjustment -----
SELECT * FROM public.weekly_budget_adjustment WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY week_start DESC;

-- ----- weekly_reports -----
SELECT * FROM public.weekly_reports WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY week_end DESC LIMIT 104;

-- ----- xp_events -----
SELECT * FROM public.xp_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500;

-- =============================================================================
-- 3. INDIRECT TABLES (linked via strategy / mission_chain)
-- =============================================================================

-- ----- alignment_log (via strategy_focus -> user_id) -----
SELECT al.*
FROM public.alignment_log al
JOIN public.strategy_focus sf ON sf.id = al.strategy_id
WHERE sf.user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
ORDER BY al.date DESC;

-- ----- strategy_review (via strategy_focus -> user_id) -----
SELECT sr.*
FROM public.strategy_review sr
JOIN public.strategy_focus sf ON sf.id = sr.strategy_id
WHERE sf.user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
ORDER BY sr.week_start DESC;

-- ----- mission_chain_steps (via mission_chains -> user_id) -----
SELECT mcs.*
FROM public.mission_chain_steps mcs
JOIN public.mission_chains mc ON mc.id = mcs.chain_id
WHERE mc.user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'
ORDER BY mc.created_at DESC, mcs.step_order;

-- =============================================================================
-- 4. POTENTIAL DUPLICATE / OVERLAP NOTES (for optimization)
-- See also: docs/duplicate-load-analysis.md (which app flows load which tables)
-- =============================================================================
-- The dashboard and game/identity flows load several of the same tables:
--
-- Loaded by BOTH dashboard-data and game-state (or identity-engine):
--   - user_xp, user_streak, daily_state (today), achievements, user_skills
--   - missions (game-state and others), tasks (dashboard + game-state via finance)
--
-- Consider:
--   - Single "game state" or "identity + XP" fetch that returns user_xp, user_streak,
--     achievements, user_skills, daily_state (today), and optionally missions, then
--     reuse that payload on dashboard and HQ/game UI to avoid loading twice.
--   - user_identity_engine + user_reputation + user_streak are often needed together
--     (identity-engine.ts); ensure one call fetches all three.
--   - budget: getBudgetSettings + getFinanceState + getCurrentMonthExpensesCents touch
--     users, income_sources, budget_entries, budget_targets, savings_goals; consider
--     one combined "budget context" server action.
--
-- Tables that are "single row per user" (1:1): users, user_xp, user_streak,
-- user_identity_engine, user_reputation, user_preferences, mission_state,
-- behavior_profile, user_behavior, user_gamification, strategy_check_in.
-- If the app requests these in multiple places, consolidate into one load.
-- =============================================================================

-- =============================================================================
-- RUN THIS LAST: full user data in ONE result (table_name, row_ordinal, row_data)
-- When you "Run" the whole file, Supabase shows only this result.
-- =============================================================================
SELECT table_name, row_ordinal, row_data FROM (
  SELECT 'users' AS table_name, row_number() OVER () AS row_ordinal, to_jsonb(x) AS row_data FROM (SELECT * FROM public.users WHERE id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'accountability_settings', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.accountability_settings WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'achievements', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.achievements WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'alternatives', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.alternatives WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'analytics_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.analytics_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500) x
  UNION ALL SELECT 'assistant_conversation_turn', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.assistant_conversation_turn WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'assistant_feature_flags', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.assistant_feature_flags WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'assistant_user_context', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.assistant_user_context WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'autopilot_day', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.autopilot_day WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'autopilot_refusal', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.autopilot_refusal WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'avoidance_tracker', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.avoidance_tracker WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'behavior_patterns', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.behavior_patterns WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'behavior_profile', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.behavior_profile WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'behaviour_log', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.behaviour_log WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC, created_at DESC LIMIT 500) x
  UNION ALL SELECT 'budget_entries', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.budget_entries WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC, created_at DESC LIMIT 500) x
  UNION ALL SELECT 'budget_entries_archive', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.budget_entries_archive WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY archived_at DESC LIMIT 500) x
  UNION ALL SELECT 'budget_targets', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.budget_targets WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'calendar_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.calendar_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY start_at DESC LIMIT 500) x
  UNION ALL SELECT 'campaigns', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.campaigns WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'daily_state', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.daily_state WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC LIMIT 365) x
  UNION ALL SELECT 'daily_explanations', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.daily_explanations WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'education_options', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.education_options WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'escalation_logs', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.escalation_logs WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'feature_flags', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.feature_flags WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'financial_discipline_score', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.financial_discipline_score WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'friction_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.friction_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500) x
  UNION ALL SELECT 'identity_drift_snapshot', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.identity_drift_snapshot WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'identity_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.identity_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'income_sources', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.income_sources WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'learning_sessions', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.learning_sessions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC LIMIT 500) x
  UNION ALL SELECT 'mission_chains', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.mission_chains WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'mission_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.mission_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY occurred_at DESC LIMIT 500) x
  UNION ALL SELECT 'missed_opportunity_index', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.missed_opportunity_index WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'mission_state', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.mission_state WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'missions', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.missions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500) x
  UNION ALL SELECT 'monthly_books', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.monthly_books WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'pending_xp_notifications', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.pending_xp_notifications WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'quarterly_strategy', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.quarterly_strategy WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'reality_reports', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.reality_reports WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'recurring_budget_templates', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.recurring_budget_templates WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'savings_contributions', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.savings_contributions WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'savings_goals', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.savings_goals WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'strategy_check_in', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.strategy_check_in WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'strategy_focus', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.strategy_focus WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'strategy_key_results', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.strategy_key_results WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'strategy_review', row_number() OVER (), to_jsonb(x) FROM (SELECT sr.* FROM public.strategy_review sr JOIN public.strategy_focus sf ON sf.id = sr.strategy_id WHERE sf.user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'alignment_log', row_number() OVER (), to_jsonb(x) FROM (SELECT al.* FROM public.alignment_log al JOIN public.strategy_focus sf ON sf.id = al.strategy_id WHERE sf.user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'mission_chain_steps', row_number() OVER (), to_jsonb(x) FROM (SELECT mcs.* FROM public.mission_chain_steps mcs JOIN public.mission_chains mc ON mc.id = mcs.chain_id WHERE mc.user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'task_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.task_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY occurred_at DESC LIMIT 500) x
  UNION ALL SELECT 'tasks', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.tasks WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY due_date DESC NULLS LAST, created_at DESC LIMIT 500) x
  UNION ALL SELECT 'user_analytics_daily', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_analytics_daily WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY date DESC LIMIT 365) x
  UNION ALL SELECT 'user_behavior', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_behavior WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_category_limits', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_category_limits WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_gamification', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_gamification WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_google_tokens', row_number() OVER (), to_jsonb(x) AS row_data FROM (SELECT user_id, created_at, updated_at, expires_at FROM public.user_google_tokens WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_identity_engine', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_identity_engine WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_preferences', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_preferences WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_reputation', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_reputation WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_skills', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_skills WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_streak', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_streak WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'user_xp', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.user_xp WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'weekly_budget_adjustment', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.weekly_budget_adjustment WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de') x
  UNION ALL SELECT 'weekly_reports', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.weekly_reports WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY week_end DESC LIMIT 104) x
  UNION ALL SELECT 'xp_events', row_number() OVER (), to_jsonb(x) FROM (SELECT * FROM public.xp_events WHERE user_id = 'b7fc6c46-b8ca-41f4-8ece-938a34d014de' ORDER BY created_at DESC LIMIT 500) x
) all_data
ORDER BY table_name, row_ordinal;
