import type { MoodTriggerId } from "@/lib/mood-intervention-config";
import { TRIGGER_COPY } from "@/lib/mood-intervention-config";

export type AnalyticsDay = {
  date: string;
  active_seconds: number | null;
  tasks_completed: number | null;
  tasks_planned: number | null;
  learning_minutes: number | null;
};

export type MoodEngineInput = {
  today: string;
  localHour: number;
  localMinute: number;
  /** bias shifts late-night window earlier (minutes). */
  lateNightBiasMinutes: number;
  todayAnalytics: AnalyticsDay | null;
  prevDaysAnalytics: AnalyticsDay[];
  /** Today's tasks: incomplete count, total due today */
  incompleteToday: number;
  plannedToday: number;
  completedToday: number;
  carryOverTotal: number;
  /** From daily_state when check-in exists */
  physicalHealth1to10: number | null;
};

const LONG_SESSION_SEC = 3 * 3600;
const CHAOS_PLANNED = 7;
const CHAOS_DONE = 2;
const MANY_INCOMPLETE = 11;
const DROP_RATIO = 0.35;

function activityScore(a: AnalyticsDay | null): number {
  if (!a) return 0;
  const t = a.tasks_completed ?? 0;
  const l = (a.learning_minutes ?? 0) / 20;
  return t + l;
}

function avgPrevActivityScore(days: AnalyticsDay[]): number {
  if (!days.length) return 0;
  let s = 0;
  for (const d of days) s += activityScore(d);
  return s / days.length;
}

/** Late night: 23:00–02:00 local, adjusted by bias. */
function isLateNightWindow(hour: number, minute: number, biasMinutes: number): boolean {
  const total = hour * 60 + minute - biasMinutes;
  const h = Math.floor(((total % 1440) + 1440) % 1440 / 60);
  return h >= 23 || h <= 2;
}

export function pickMoodTrigger(input: MoodEngineInput): MoodTriggerId | null {
  const {
    prevDaysAnalytics,
    todayAnalytics,
    localHour,
    localMinute,
    lateNightBiasMinutes,
    incompleteToday,
    plannedToday,
    completedToday,
    carryOverTotal,
    physicalHealth1to10,
  } = input;

  const prev7 = prevDaysAnalytics.filter((d) => d.date < input.today).slice(-7);
  const avgPrev = avgPrevActivityScore(prev7);
  const todayScore = activityScore(todayAnalytics);

  const isoPrev = (from: string, daysBack: number): string => {
    const x = new Date(from + "T12:00:00Z");
    x.setUTCDate(x.getUTCDate() - daysBack);
    return x.toISOString().slice(0, 10);
  };
  const dayRows = new Map(prevDaysAnalytics.map((d) => [d.date, d]));
  const inactiveRow = (d: string): boolean => {
    const r = dayRows.get(d);
    if (!r) return false;
    return (
      (r.tasks_completed ?? 0) === 0 &&
      (r.learning_minutes ?? 0) === 0 &&
      (r.active_seconds ?? 0) < 600
    );
  };

  // 1) Idle streak: yesterday + day before both logged and flat
  const y1 = isoPrev(input.today, 1);
  const y2 = isoPrev(input.today, 2);
  if (inactiveRow(y1) && inactiveRow(y2)) {
    return "idle_streak";
  }

  // 2) Late night + already heavy use today
  const activeToday = todayAnalytics?.active_seconds ?? 0;
  if (
    isLateNightWindow(localHour, localMinute, lateNightBiasMinutes) &&
    activeToday >= 45 * 60
  ) {
    return "late_night_active";
  }

  // 3) Long active session (tracked day total)
  if (activeToday >= LONG_SESSION_SEC) {
    return "long_active_session";
  }

  // 4) Task chaos
  if (plannedToday >= CHAOS_PLANNED && completedToday <= CHAOS_DONE) {
    return "task_chaos";
  }

  // 5) Many incomplete / carry-over stress
  if (incompleteToday >= MANY_INCOMPLETE || carryOverTotal >= 8) {
    return "many_incomplete";
  }

  // 6) Activity drop vs your week
  if (avgPrev >= 2 && todayScore < avgPrev * DROP_RATIO && (todayAnalytics?.tasks_planned ?? 0) >= 1) {
    return "activity_drop";
  }

  // 7) Low physical score from check-in
  if (physicalHealth1to10 != null && physicalHealth1to10 <= 3) {
    return "low_physical_score";
  }

  return null;
}

export function titleForTrigger(triggerId: MoodTriggerId, salt: number): string {
  const titles = ["Even eerlijk", "Stop even", "Je zit niet lekker"];
  return titles[salt % titles.length];
}

export function copyForTrigger(triggerId: MoodTriggerId): { mood: (typeof TRIGGER_COPY)[MoodTriggerId]["mood"]; body: string } {
  return TRIGGER_COPY[triggerId];
}
