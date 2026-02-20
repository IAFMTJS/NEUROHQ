/**
 * Client-side Today Engine: runs bucketing and suggestion locally from raw data.
 * Use with getTodayEngineData() — one fetch, then all logic in the browser.
 */

import { bucketTodayItems, rawTaskToTodayItem, type BucketedToday, type RawTodayTask } from "@/lib/today-engine";
import { getSuggestedTaskCount } from "@/lib/utils/energy";
import { xpToNextLevel } from "@/lib/xp";

export interface SmartSuggestion {
  text: string;
  type: "streak" | "level" | "momentum" | "first_mission" | null;
}

export interface TodayEngineData {
  tasks: RawTodayTask[];
  streakAtRisk: boolean;
  mode: string;
  date: string;
  xp: { total_xp: number };
  dailyState: {
    energy: number;
    focus: number;
    sensory_load: number;
    social_load: number;
    sleep_hours: number | null;
  } | null;
}

export interface ClientTodayEngineResult {
  bucketed: BucketedToday;
  streakAtRisk: boolean;
  date: string;
  suggestion: SmartSuggestion;
  suggestedTaskCount: number;
}

function buildSuggestion(
  bucketed: BucketedToday,
  totalXp: number,
  streakAtRisk: boolean
): SmartSuggestion {
  if (streakAtRisk && (bucketed.critical.length > 0 || bucketed.high_impact.length > 0)) {
    return { text: "Nog 1 missie voor streak behoud.", type: "streak" };
  }

  const toNext = xpToNextLevel(totalXp);
  const firstHighImpact = bucketed.high_impact[0];
  if (toNext > 0 && toNext <= 150 && firstHighImpact) {
    const pct = Math.round((1 - toNext / 150) * 100);
    const title = firstHighImpact.title.slice(0, 25) + (firstHighImpact.title.length > 25 ? "…" : "");
    return {
      text: `Je zit ${pct}% naar level up. Voltooi "${title}" en unlock.`,
      type: "level",
    };
  }

  if (bucketed.critical.length > 0 || bucketed.high_impact.length > 0) {
    const top = bucketed.critical[0] ?? bucketed.high_impact[0];
    const xpEst = top?.xpReward ?? 50;
    return {
      text: `5 minuten nu = ~${xpEst} XP. Start met de eerste missie.`,
      type: "first_mission",
    };
  }

  return { text: "", type: null };
}

/**
 * Run the today engine on raw data. Pure, no I/O. Use in browser or worker.
 */
export function runTodayEngine(data: TodayEngineData): ClientTodayEngineResult {
  const items = data.tasks.map((t, i) => rawTaskToTodayItem(t, i, data.streakAtRisk));
  const bucketed = bucketTodayItems(items, { streakAtRisk: data.streakAtRisk, nearUnlockSkills: [] });
  const suggestion = buildSuggestion(bucketed, data.xp.total_xp, data.streakAtRisk);

  const suggestedTaskCount = data.dailyState
    ? getSuggestedTaskCount({
        energy: data.dailyState.energy,
        focus: data.dailyState.focus,
        sensory_load: data.dailyState.sensory_load,
        social_load: data.dailyState.social_load,
        sleep_hours: data.dailyState.sleep_hours,
      })
    : 3;

  return {
    bucketed,
    streakAtRisk: data.streakAtRisk,
    date: data.date,
    suggestion,
    suggestedTaskCount,
  };
}
