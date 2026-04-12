import {
  computeBrainStatusAveragePercent,
  type DailyRowForBrain,
} from "@/lib/dcic/brain-status-average";

/** daily_state row shape for snapshotting into user_analytics_daily. */
export type DailyStateSnapshotRow = {
  user_id: string;
  date: string;
  energy?: number | null;
  focus?: number | null;
  sensory_load?: number | null;
  mental_battery?: number | null;
  physical_health?: number | null;
  load?: number | null;
  sleep_hours?: number | null;
  is_rest_day?: boolean | null;
  emotional_state?: string | null;
};

export function dailyStateToDailyRowForBrain(row: DailyStateSnapshotRow): DailyRowForBrain {
  return {
    energy: row.energy ?? null,
    focus: row.focus ?? null,
    sensory_load: row.sensory_load ?? null,
    load: row.load ?? null,
    mental_battery: row.mental_battery ?? null,
    physical_health: row.physical_health ?? null,
    sleep_hours: row.sleep_hours ?? null,
  };
}

export function computeBrainCompositePctFromDailyState(row: DailyStateSnapshotRow): number | null {
  return computeBrainStatusAveragePercent(dailyStateToDailyRowForBrain(row));
}

/** Map user_analytics_daily brain columns → DailyRowForBrain (for DCIC war-tier window). */
export function analyticsBrainToDailyRowForBrain(row: {
  energy_avg?: number | null;
  focus_avg?: number | null;
  sensory_load_avg?: number | null;
  mental_battery_avg?: number | null;
  physical_health_avg?: number | null;
  load_avg?: number | null;
  sleep_hours_avg?: number | null;
}): DailyRowForBrain {
  return {
    energy: row.energy_avg ?? null,
    focus: row.focus_avg ?? null,
    sensory_load: row.sensory_load_avg ?? null,
    load: row.load_avg ?? null,
    mental_battery: row.mental_battery_avg ?? null,
    physical_health: row.physical_health_avg ?? null,
    sleep_hours: row.sleep_hours_avg ?? null,
  };
}
