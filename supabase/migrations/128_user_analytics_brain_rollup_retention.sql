-- NEUROHQ — Brain/daily_state rollup into user_analytics_daily for retention.
-- After snapshot, cron can delete old daily_state rows (only "today" stays hot in app TZ).

ALTER TABLE public.user_analytics_daily
  ADD COLUMN IF NOT EXISTS sensory_load_avg numeric(3,1)
    CHECK (sensory_load_avg IS NULL OR (sensory_load_avg >= 0 AND sensory_load_avg <= 10)),
  ADD COLUMN IF NOT EXISTS mental_battery_avg numeric(3,1)
    CHECK (mental_battery_avg IS NULL OR (mental_battery_avg >= 0 AND mental_battery_avg <= 10)),
  ADD COLUMN IF NOT EXISTS physical_health_avg numeric(3,1)
    CHECK (physical_health_avg IS NULL OR (physical_health_avg >= 0 AND physical_health_avg <= 10)),
  ADD COLUMN IF NOT EXISTS load_avg numeric(5,1),
  ADD COLUMN IF NOT EXISTS sleep_hours_avg numeric(4,1),
  ADD COLUMN IF NOT EXISTS is_rest_day boolean,
  ADD COLUMN IF NOT EXISTS brain_composite_pct smallint
    CHECK (brain_composite_pct IS NULL OR (brain_composite_pct >= 0 AND brain_composite_pct <= 100)),
  ADD COLUMN IF NOT EXISTS emotional_state text,
  ADD COLUMN IF NOT EXISTS dcic_overdrive_weekly_slot boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_analytics_daily.sensory_load_avg IS 'Snapshot from daily_state before prune (1–10 scale)';
COMMENT ON COLUMN public.user_analytics_daily.mental_battery_avg IS 'Snapshot from daily_state before prune';
COMMENT ON COLUMN public.user_analytics_daily.physical_health_avg IS 'Snapshot from daily_state before prune';
COMMENT ON COLUMN public.user_analytics_daily.load_avg IS 'Snapshot from daily_state.load (system load)';
COMMENT ON COLUMN public.user_analytics_daily.sleep_hours_avg IS 'Snapshot from daily_state.sleep_hours';
COMMENT ON COLUMN public.user_analytics_daily.is_rest_day IS 'Snapshot from daily_state.is_rest_day';
COMMENT ON COLUMN public.user_analytics_daily.brain_composite_pct IS '0–100 brain composite for war-tier / trends (same formula as DCIC brain average)';
COMMENT ON COLUMN public.user_analytics_daily.emotional_state IS 'Snapshot from daily_state.emotional_state for analytics after prune';
COMMENT ON COLUMN public.user_analytics_daily.dcic_overdrive_weekly_slot IS 'True if that calendar day had weekly_slot overdrive trigger (for ISO-week caps after daily_state prune)';
