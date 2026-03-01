/**
 * Client-side Today Engine: runs bucketing and suggestion locally from raw data.
 * Use with getTodayEngineData() — one fetch, then all logic in the browser.
 */

import { bucketTodayItems, rawTaskToTodayItem, type BucketedToday, type RawTodayTask, type TodayItem } from "@/lib/today-engine";
import type { BehaviorProfile } from "@/types/behavior-profile.types";
import { getSuggestedTaskCount } from "@/lib/utils/energy";
import { xpToNextLevel } from "@/lib/xp";
import { buildBehaviorSuggestions, type BehaviorSuggestions } from "@/lib/behavior-missions";

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
  behaviorProfile: BehaviorProfile;
  /** Anti‑escape: Minimal Integrity hint na 3+ dagen zonder completion. */
  minimalIntegrity?: {
    active: boolean;
    daysInactive: number;
  } | null;
  forcedConfrontation?: ForcedConfrontation | null;
}

export interface ForcedConfrontation {
  tag: "household" | "administration" | "social";
  level: 1 | 2 | 3;
  title: string;
  description: string;
  skipped: number;
  date: string;
}

export interface ClientTodayEngineResult {
  bucketed: BucketedToday;
  streakAtRisk: boolean;
  date: string;
  suggestion: SmartSuggestion;
  suggestedTaskCount: number;
  forcedConfrontation: ForcedConfrontation | null;
  behaviorSuggestions: BehaviorSuggestions;
  minimalIntegrity: {
    active: boolean;
    daysInactive: number;
  } | null;
}

export function computeAllowHeavyNow(profile: BehaviorProfile, now: Date): boolean {
  const hour = now.getHours(); // lokale tijd; dashboard draait in user-timezone

  if (profile.energyPattern === "evening_crash") {
    // Zware missies alleen vóór 16u; na 16u geen heavy in Critical/High Impact.
    return hour < 16;
  }

  if (profile.energyPattern === "morning_low") {
    // Ochtend is traag; heavy pas na 10u.
    return hour >= 10;
  }

  // stable: altijd toegestaan.
  return true;
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
  const items: TodayItem[] = data.tasks.map((t, i) => rawTaskToTodayItem(t, i, data.streakAtRisk));
  const allowHeavyNow = computeAllowHeavyNow(data.behaviorProfile, new Date());
  const bucketed = bucketTodayItems(items, {
    streakAtRisk: data.streakAtRisk,
    nearUnlockSkills: [],
    allowHeavyNow,
  });
  const suggestion = buildSuggestion(bucketed, data.xp.total_xp, data.streakAtRisk);

  const baseSuggested = data.dailyState
    ? getSuggestedTaskCount({
        energy: data.dailyState.energy,
        focus: data.dailyState.focus,
        sensory_load: data.dailyState.sensory_load,
        social_load: data.dailyState.social_load,
        sleep_hours: data.dailyState.sleep_hours,
      })
    : 3;

  let suggestedTaskCount = baseSuggested;
  if (data.behaviorProfile.disciplineLevel === "low") {
    suggestedTaskCount = Math.max(1, baseSuggested - 1);
  } else if (data.behaviorProfile.disciplineLevel === "high") {
    suggestedTaskCount = Math.min(8, baseSuggested + 1);
  }

  const behaviorSuggestions = buildBehaviorSuggestions(data.behaviorProfile);

  return {
    bucketed,
    streakAtRisk: data.streakAtRisk,
    date: data.date,
    suggestion,
    suggestedTaskCount,
    forcedConfrontation:
      (data as TodayEngineData & { forcedConfrontation?: ForcedConfrontation | null }).forcedConfrontation ?? null,
    behaviorSuggestions,
    minimalIntegrity: data.minimalIntegrity && data.minimalIntegrity.active ? data.minimalIntegrity : null,
  };
}
