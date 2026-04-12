-- =============================================================================
-- NEUROHQ — Per-user row counts (alle tabellen met user_id / indirect via strategy of chains)
--
-- Doel: per profiel in public.users zien hoeveel rijen er in de belangrijkste tabellen staan
-- (taken, budget, notificaties, dagelijkse status / "brain" = daily_state, XP, missies, enz.).
--
-- Uitvoeren: Supabase Dashboard → SQL Editor (aanbevolen: service role of admin; RLS kan
--   tellen voor gewone clients blokkeren).
--
-- Let op:
-- - Alleen gebruikers met een rij in public.users verschijnen. Auth-users zonder profiel
--   staan hier niet in.
-- - "Brain status" in de app = dagelijkse registraties in public.daily_state (geen aparte
--   brain_status-tabel).
-- - Als een migratie bij jullie nog niet is gedraaid, faalt de query op die tabel: comment
--   die LEFT JOIN-regel tijdelijk uit of verwijder de kolom.
-- - behavioral_notifications (migratie 076) staat niet in dit script: voeg toe na die migratie
--   op productie, of draai de migratie eerst.
--
-- Filter één user: zet in scope een concrete uuid. Alle users: gebruik NULL::uuid.
-- =============================================================================

WITH scope AS (
  SELECT 'b7fc6c46-b8ca-41f4-8ece-938a34d014de'::uuid AS only_user_id
  -- Alle users: vervang bovenstaande regel door: SELECT NULL::uuid AS only_user_id
)
SELECT
  u.id AS user_id,
  u.email,
  u.display_name,
  u.role,
  u.created_at AS user_created_at,

  COALESCE(t_tasks.n, 0) AS tasks,
  COALESCE(t_task_events.n, 0) AS task_events,

  COALESCE(t_daily_state.n, 0) AS daily_state_rows,
  COALESCE(t_daily_explanations.n, 0) AS daily_explanations,

  COALESCE(t_budget_entries.n, 0) AS budget_entries,
  COALESCE(t_budget_entries_archive.n, 0) AS budget_entries_archive,
  COALESCE(t_budget_targets.n, 0) AS budget_targets,
  COALESCE(t_recurring_budget_templates.n, 0) AS recurring_budget_templates,
  COALESCE(t_flex_budget_ledger.n, 0) AS flex_budget_ledger,
  COALESCE(t_budget_weekly_reviews.n, 0) AS budget_weekly_reviews,
  COALESCE(t_budget_control_locks.n, 0) AS budget_control_locks,
  COALESCE(t_budget_emergency_expense_logs.n, 0) AS budget_emergency_expense_logs,
  COALESCE(t_budget_training_logs.n, 0) AS budget_training_logs,
  COALESCE(t_budget_optimization_challenges.n, 0) AS budget_optimization_challenges,
  COALESCE(t_weekly_budget_adjustment.n, 0) AS weekly_budget_adjustment,
  COALESCE(t_income_sources.n, 0) AS income_sources,
  COALESCE(t_savings_goals.n, 0) AS savings_goals,
  COALESCE(t_savings_contributions.n, 0) AS savings_contributions,

  COALESCE(t_user_alerts.n, 0) AS user_alerts,
  COALESCE(t_user_alert_suppressions.n, 0) AS user_alert_suppressions,
  COALESCE(t_pending_xp_notifications.n, 0) AS pending_xp_notifications,
  COALESCE(t_push_sends_log.n, 0) AS push_sends_log,
  COALESCE(t_push_engagement.n, 0) AS push_engagement,
  COALESCE(t_push_daily_push_claims.n, 0) AS push_daily_push_claims,

  COALESCE(t_calendar_events.n, 0) AS calendar_events,
  COALESCE(t_learning_sessions.n, 0) AS learning_sessions,
  COALESCE(t_education_options.n, 0) AS education_options,
  COALESCE(t_monthly_books.n, 0) AS monthly_books,
  COALESCE(t_study_plan.n, 0) AS study_plan,

  COALESCE(t_missions.n, 0) AS missions,
  COALESCE(t_mission_events.n, 0) AS mission_events,
  COALESCE(t_mission_state.n, 0) AS mission_state,
  COALESCE(t_mission_chains.n, 0) AS mission_chains,
  COALESCE(t_mission_chain_steps.n, 0) AS mission_chain_steps,
  COALESCE(t_mission_outcome_events.n, 0) AS mission_outcome_events,
  COALESCE(t_friction_events.n, 0) AS friction_events,

  COALESCE(t_user_quest_campaign_progress.n, 0) AS user_quest_campaign_progress,
  COALESCE(t_user_platform_game_progress.n, 0) AS user_platform_game_progress,
  COALESCE(t_user_protocol_progress.n, 0) AS user_protocol_progress,

  COALESCE(t_strategy_focus.n, 0) AS strategy_focus,
  COALESCE(t_strategy_key_results.n, 0) AS strategy_key_results,
  COALESCE(t_strategy_check_in.n, 0) AS strategy_check_in,
  COALESCE(t_strategy_review.n, 0) AS strategy_review,
  COALESCE(t_alignment_log.n, 0) AS alignment_log,
  COALESCE(t_quarterly_strategy.n, 0) AS quarterly_strategy,

  COALESCE(t_user_xp.n, 0) AS user_xp,
  COALESCE(t_xp_events.n, 0) AS xp_events,
  COALESCE(t_user_streak.n, 0) AS user_streak,
  COALESCE(t_achievements.n, 0) AS achievements,
  COALESCE(t_user_skills.n, 0) AS user_skills,
  COALESCE(t_user_gamification.n, 0) AS user_gamification,

  COALESCE(t_user_analytics_daily.n, 0) AS user_analytics_daily,
  COALESCE(t_analytics_events.n, 0) AS analytics_events,
  COALESCE(t_behaviour_log.n, 0) AS behaviour_log,
  COALESCE(t_behavior_profile.n, 0) AS behavior_profile,
  COALESCE(t_behavior_patterns.n, 0) AS behavior_patterns,
  COALESCE(t_user_behavior.n, 0) AS user_behavior,
  COALESCE(t_weekly_tactical_mode.n, 0) AS weekly_tactical_mode,
  COALESCE(t_weekly_reports.n, 0) AS weekly_reports,
  COALESCE(t_reality_reports.n, 0) AS reality_reports,

  COALESCE(t_user_preferences.n, 0) AS user_preferences,
  COALESCE(t_user_identity_engine.n, 0) AS user_identity_engine,
  COALESCE(t_user_reputation.n, 0) AS user_reputation,
  COALESCE(t_identity_events.n, 0) AS identity_events,
  COALESCE(t_identity_drift_snapshot.n, 0) AS identity_drift_snapshot,

  COALESCE(t_assistant_conversation_turn.n, 0) AS assistant_conversation_turn,
  COALESCE(t_assistant_user_context.n, 0) AS assistant_user_context,
  COALESCE(t_assistant_feature_flags.n, 0) AS assistant_feature_flags,

  COALESCE(t_autopilot_day.n, 0) AS autopilot_day,
  COALESCE(t_autopilot_refusal.n, 0) AS autopilot_refusal,
  COALESCE(t_avoidance_tracker.n, 0) AS avoidance_tracker,
  COALESCE(t_alternatives.n, 0) AS alternatives,
  COALESCE(t_campaigns.n, 0) AS campaigns,
  COALESCE(t_escalation_logs.n, 0) AS escalation_logs,
  COALESCE(t_feature_flags.n, 0) AS feature_flags,
  COALESCE(t_financial_discipline_score.n, 0) AS financial_discipline_score,
  COALESCE(t_missed_opportunity_index.n, 0) AS missed_opportunity_index,
  COALESCE(t_user_category_limits.n, 0) AS user_category_limits,
  COALESCE(t_user_google_tokens.n, 0) AS user_google_tokens,
  COALESCE(t_accountability_settings.n, 0) AS accountability_settings,
  COALESCE(t_user_economy.n, 0) AS user_economy,
  COALESCE(t_user_acceptance_gates.n, 0) AS user_acceptance_gates,
  COALESCE(t_user_actions_audit.n, 0) AS user_actions_audit,
  COALESCE(t_payday_reflection_surveys.n, 0) AS payday_reflection_surveys

FROM public.users u
CROSS JOIN scope s

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.tasks GROUP BY user_id) t_tasks ON t_tasks.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.task_events GROUP BY user_id) t_task_events ON t_task_events.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.daily_state GROUP BY user_id) t_daily_state ON t_daily_state.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.daily_explanations GROUP BY user_id) t_daily_explanations ON t_daily_explanations.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.budget_entries GROUP BY user_id) t_budget_entries ON t_budget_entries.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.budget_entries_archive GROUP BY user_id) t_budget_entries_archive ON t_budget_entries_archive.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.budget_targets GROUP BY user_id) t_budget_targets ON t_budget_targets.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.recurring_budget_templates GROUP BY user_id) t_recurring_budget_templates ON t_recurring_budget_templates.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.flex_budget_ledger GROUP BY user_id) t_flex_budget_ledger ON t_flex_budget_ledger.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.budget_weekly_reviews GROUP BY user_id) t_budget_weekly_reviews ON t_budget_weekly_reviews.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.budget_control_locks GROUP BY user_id) t_budget_control_locks ON t_budget_control_locks.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.budget_emergency_expense_logs GROUP BY user_id) t_budget_emergency_expense_logs ON t_budget_emergency_expense_logs.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.budget_training_logs GROUP BY user_id) t_budget_training_logs ON t_budget_training_logs.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.budget_optimization_challenges GROUP BY user_id) t_budget_optimization_challenges ON t_budget_optimization_challenges.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.weekly_budget_adjustment GROUP BY user_id) t_weekly_budget_adjustment ON t_weekly_budget_adjustment.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.income_sources GROUP BY user_id) t_income_sources ON t_income_sources.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.savings_goals GROUP BY user_id) t_savings_goals ON t_savings_goals.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.savings_contributions GROUP BY user_id) t_savings_contributions ON t_savings_contributions.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_alerts GROUP BY user_id) t_user_alerts ON t_user_alerts.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_alert_suppressions GROUP BY user_id) t_user_alert_suppressions ON t_user_alert_suppressions.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.pending_xp_notifications GROUP BY user_id) t_pending_xp_notifications ON t_pending_xp_notifications.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.push_sends_log GROUP BY user_id) t_push_sends_log ON t_push_sends_log.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.push_engagement GROUP BY user_id) t_push_engagement ON t_push_engagement.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.push_daily_push_claims GROUP BY user_id) t_push_daily_push_claims ON t_push_daily_push_claims.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.calendar_events GROUP BY user_id) t_calendar_events ON t_calendar_events.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.learning_sessions GROUP BY user_id) t_learning_sessions ON t_learning_sessions.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.education_options GROUP BY user_id) t_education_options ON t_education_options.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.monthly_books GROUP BY user_id) t_monthly_books ON t_monthly_books.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.study_plan GROUP BY user_id) t_study_plan ON t_study_plan.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.missions GROUP BY user_id) t_missions ON t_missions.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.mission_events GROUP BY user_id) t_mission_events ON t_mission_events.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.mission_state GROUP BY user_id) t_mission_state ON t_mission_state.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.mission_chains GROUP BY user_id) t_mission_chains ON t_mission_chains.user_id = u.id
LEFT JOIN (
  SELECT mc.user_id, count(*)::bigint AS n
  FROM public.mission_chain_steps mcs
  JOIN public.mission_chains mc ON mc.id = mcs.chain_id
  GROUP BY mc.user_id
) t_mission_chain_steps ON t_mission_chain_steps.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.mission_outcome_events GROUP BY user_id) t_mission_outcome_events ON t_mission_outcome_events.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.friction_events GROUP BY user_id) t_friction_events ON t_friction_events.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_quest_campaign_progress GROUP BY user_id) t_user_quest_campaign_progress ON t_user_quest_campaign_progress.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_platform_game_progress GROUP BY user_id) t_user_platform_game_progress ON t_user_platform_game_progress.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_protocol_progress GROUP BY user_id) t_user_protocol_progress ON t_user_protocol_progress.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.strategy_focus GROUP BY user_id) t_strategy_focus ON t_strategy_focus.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.strategy_key_results GROUP BY user_id) t_strategy_key_results ON t_strategy_key_results.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.strategy_check_in GROUP BY user_id) t_strategy_check_in ON t_strategy_check_in.user_id = u.id
LEFT JOIN (
  SELECT sf.user_id, count(*)::bigint AS n
  FROM public.strategy_review sr
  JOIN public.strategy_focus sf ON sf.id = sr.strategy_id
  GROUP BY sf.user_id
) t_strategy_review ON t_strategy_review.user_id = u.id
LEFT JOIN (
  SELECT sf.user_id, count(*)::bigint AS n
  FROM public.alignment_log al
  JOIN public.strategy_focus sf ON sf.id = al.strategy_id
  GROUP BY sf.user_id
) t_alignment_log ON t_alignment_log.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.quarterly_strategy GROUP BY user_id) t_quarterly_strategy ON t_quarterly_strategy.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_xp GROUP BY user_id) t_user_xp ON t_user_xp.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.xp_events GROUP BY user_id) t_xp_events ON t_xp_events.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_streak GROUP BY user_id) t_user_streak ON t_user_streak.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.achievements GROUP BY user_id) t_achievements ON t_achievements.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_skills GROUP BY user_id) t_user_skills ON t_user_skills.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_gamification GROUP BY user_id) t_user_gamification ON t_user_gamification.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_analytics_daily GROUP BY user_id) t_user_analytics_daily ON t_user_analytics_daily.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.analytics_events GROUP BY user_id) t_analytics_events ON t_analytics_events.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.behaviour_log GROUP BY user_id) t_behaviour_log ON t_behaviour_log.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.behavior_profile GROUP BY user_id) t_behavior_profile ON t_behavior_profile.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.behavior_patterns GROUP BY user_id) t_behavior_patterns ON t_behavior_patterns.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_behavior GROUP BY user_id) t_user_behavior ON t_user_behavior.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.weekly_tactical_mode GROUP BY user_id) t_weekly_tactical_mode ON t_weekly_tactical_mode.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.weekly_reports GROUP BY user_id) t_weekly_reports ON t_weekly_reports.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.reality_reports GROUP BY user_id) t_reality_reports ON t_reality_reports.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_preferences GROUP BY user_id) t_user_preferences ON t_user_preferences.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_identity_engine GROUP BY user_id) t_user_identity_engine ON t_user_identity_engine.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_reputation GROUP BY user_id) t_user_reputation ON t_user_reputation.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.identity_events GROUP BY user_id) t_identity_events ON t_identity_events.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.identity_drift_snapshot GROUP BY user_id) t_identity_drift_snapshot ON t_identity_drift_snapshot.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.assistant_conversation_turn GROUP BY user_id) t_assistant_conversation_turn ON t_assistant_conversation_turn.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.assistant_user_context GROUP BY user_id) t_assistant_user_context ON t_assistant_user_context.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.assistant_feature_flags GROUP BY user_id) t_assistant_feature_flags ON t_assistant_feature_flags.user_id = u.id

LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.autopilot_day GROUP BY user_id) t_autopilot_day ON t_autopilot_day.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.autopilot_refusal GROUP BY user_id) t_autopilot_refusal ON t_autopilot_refusal.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.avoidance_tracker GROUP BY user_id) t_avoidance_tracker ON t_avoidance_tracker.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.alternatives GROUP BY user_id) t_alternatives ON t_alternatives.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.campaigns GROUP BY user_id) t_campaigns ON t_campaigns.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.escalation_logs GROUP BY user_id) t_escalation_logs ON t_escalation_logs.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.feature_flags GROUP BY user_id) t_feature_flags ON t_feature_flags.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.financial_discipline_score GROUP BY user_id) t_financial_discipline_score ON t_financial_discipline_score.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.missed_opportunity_index GROUP BY user_id) t_missed_opportunity_index ON t_missed_opportunity_index.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_category_limits GROUP BY user_id) t_user_category_limits ON t_user_category_limits.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_google_tokens GROUP BY user_id) t_user_google_tokens ON t_user_google_tokens.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.accountability_settings GROUP BY user_id) t_accountability_settings ON t_accountability_settings.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_economy GROUP BY user_id) t_user_economy ON t_user_economy.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_acceptance_gates GROUP BY user_id) t_user_acceptance_gates ON t_user_acceptance_gates.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.user_actions_audit GROUP BY user_id) t_user_actions_audit ON t_user_actions_audit.user_id = u.id
LEFT JOIN (SELECT user_id, count(*)::bigint AS n FROM public.payday_reflection_surveys GROUP BY user_id) t_payday_reflection_surveys ON t_payday_reflection_surveys.user_id = u.id

WHERE s.only_user_id IS NULL OR u.id = s.only_user_id
ORDER BY u.created_at ASC;
