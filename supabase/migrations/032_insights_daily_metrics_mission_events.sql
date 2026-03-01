-- NEUROHQ — Insights 2.0 data model: daily metrics + mission events
-- Enables momentum, trend, friction, and behavioral pattern analysis.
-- Run after 031_strategy_kr_checklist.sql

-- 1. Extend user_analytics_daily (daily snapshot for trends/KPIs)
ALTER TABLE public.user_analytics_daily
  ADD COLUMN IF NOT EXISTS xp_earned integer NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  ADD COLUMN IF NOT EXISTS missions_completed smallint NOT NULL DEFAULT 0 CHECK (missions_completed >= 0),
  ADD COLUMN IF NOT EXISTS energy_avg numeric(3,1) CHECK (energy_avg IS NULL OR (energy_avg >= 0 AND energy_avg <= 10)),
  ADD COLUMN IF NOT EXISTS focus_avg numeric(3,1) CHECK (focus_avg IS NULL OR (focus_avg >= 0 AND focus_avg <= 10)),
  ADD COLUMN IF NOT EXISTS session_count smallint NOT NULL DEFAULT 0 CHECK (session_count >= 0),
  ADD COLUMN IF NOT EXISTS total_session_time_seconds integer NOT NULL DEFAULT 0 CHECK (total_session_time_seconds >= 0);

COMMENT ON COLUMN public.user_analytics_daily.xp_earned IS 'XP earned this day (from missions/behaviour_log)';
COMMENT ON COLUMN public.user_analytics_daily.missions_completed IS 'Missions completed this day';
COMMENT ON COLUMN public.user_analytics_daily.energy_avg IS 'Average energy (1–10) from daily_state or session check-ins';
COMMENT ON COLUMN public.user_analytics_daily.focus_avg IS 'Average focus (1–10) from daily_state or session check-ins';
COMMENT ON COLUMN public.user_analytics_daily.session_count IS 'Number of mission/task sessions this day';
COMMENT ON COLUMN public.user_analytics_daily.total_session_time_seconds IS 'Total active session time in seconds';

-- 2. Mission events (view → start → complete | abandon) for friction and timing analysis
CREATE TABLE IF NOT EXISTS public.mission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view', 'start', 'complete', 'abandon')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  duration_before_start_seconds integer CHECK (duration_before_start_seconds IS NULL OR duration_before_start_seconds >= 0),
  duration_to_complete_seconds integer CHECK (duration_to_complete_seconds IS NULL OR duration_to_complete_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mission_events_user_occurred
  ON public.mission_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mission_events_mission
  ON public.mission_events(mission_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_mission_events_user_type
  ON public.mission_events(user_id, event_type);

ALTER TABLE public.mission_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_mission_events" ON public.mission_events
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.mission_events IS 'Mission lifecycle events for friction (twijfel), completion rate, and best-time analysis';
COMMENT ON COLUMN public.mission_events.event_type IS 'view = opened; start = began; complete = finished; abandon = left without completing';
COMMENT ON COLUMN public.mission_events.duration_before_start_seconds IS 'Seconds between view and start (hesitation/friction)';
COMMENT ON COLUMN public.mission_events.duration_to_complete_seconds IS 'Seconds between start and complete';
