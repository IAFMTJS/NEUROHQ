/**
 * Today Engine: categorize today's items into Critical | High Impact | Growth Boost.
 * The app decides, not the user — behavioural steering.
 */

import { missionEquivalentFromEnergyRequired } from "@/lib/behavioral-engine";

export type TodayBucket = "critical" | "high_impact" | "growth_boost";

export interface TodayItem {
  id: string;
  title: string;
  /** Ruwe energy_required (1–10), voor UI / consistentie met tasks. */
  energyCost: number;
  /** Missie-equivalent: mini ½, normaal 1, groot 2 — zelfde als gedragsengine. */
  missionEquivalent: number;
  /** Base XP reward (before multipliers). */
  xpReward: number;
  /** Whether missing today risks streak. */
  streakCritical?: boolean;
  /** Carry-over count (repeatedly postponed). */
  carryOverCount?: number;
  /** Skill key if linked to skill tree unlock. */
  skillLink?: string | null;
  /** Life area / category. */
  category?: string | null;
}

/** Raw task shape from server — used by client engine to run bucketing locally. */
export interface RawTodayTask {
  id: string;
  title: string | null;
  energy_required: number | null;
  impact: number | null;
  carry_over_count: number | null;
  category: string | null;
}

const DEFAULT_ENERGY = 5;
const DEFAULT_XP = 50;

/** Map raw task to TodayItem. Pure, runs on client or server. */
export function rawTaskToTodayItem(
  raw: RawTodayTask,
  index: number,
  streakAtRisk: boolean
): TodayItem {
  const energyRaw = Math.min(10, Math.max(1, raw.energy_required ?? DEFAULT_ENERGY));
  const missionEquivalent = missionEquivalentFromEnergyRequired(raw.energy_required);
  const xp = Math.max(10, Math.min(100, (raw.impact ?? 5) * 15)) || DEFAULT_XP;
  const item: TodayItem = {
    id: raw.id,
    title: raw.title ?? "Task",
    energyCost: energyRaw,
    missionEquivalent,
    xpReward: xp,
    carryOverCount: raw.carry_over_count ?? 0,
    category: raw.category ?? null,
  };
  if (streakAtRisk && index < 2) item.streakCritical = true;
  return item;
}

export interface BucketedToday {
  critical: TodayItem[];
  high_impact: TodayItem[];
  growth_boost: TodayItem[];
}

/** Standaard dagbudget in missie-equivalenten (6 = plafond bij uiterst goede energy). */
const DEFAULT_MISSION_EQUIVALENT_CAP = 6;

/** Legacy: week/calendar energy-cap (10) — niet gelijk aan missie-equivalenten. */
export const ENERGY_CAP = 10;

/**
 * Bucket today's items into Critical (streak risk), High Impact (most XP), Growth Boost (unlock progress).
 * Order within bucket: critical first by carryOver then by xp; high_impact by xp desc; growth_boost by skill progress relevance.
 * `missionEquivalent` telt mee tegen het dagbudget (grote taak = 2 slots).
 */
export function bucketTodayItems(
  items: TodayItem[],
  options: {
    /** If true, no completion yesterday → first tasks are "critical" for streak. */
    streakAtRisk: boolean;
    /** Skill keys close to unlock (e.g. 80% there) — prioritize those in growth_boost. */
    nearUnlockSkills?: string[];
    /**
     * Whether zware missies (missionEquivalent ≥ 2 of energy 9–10) allowed in Critical/High Impact right now,
     * based on energy pattern & time windows. If false, heavy items worden naar Growth Boost geduwd.
     */
    allowHeavyNow?: boolean;
    /** Max som van missionEquivalent vandaag (default 6; kan bv. getSuggestedTaskCount zijn). */
    missionEquivalentCap?: number;
  }
): BucketedToday {
  const {
    streakAtRisk,
    nearUnlockSkills = [],
    allowHeavyNow = true,
    missionEquivalentCap = DEFAULT_MISSION_EQUIVALENT_CAP,
  } = options;
  const critical: TodayItem[] = [];
  const high_impact: TodayItem[] = [];
  const growth_boost: TodayItem[] = [];

  const isHeavyTask = (item: TodayItem) =>
    (item.missionEquivalent ?? 1) >= 2 || (item.energyCost ?? 5) >= 9;

  // Sort by: streak-critical first, then by XP desc, then by carry-over
  const sorted = [...items].sort((a, b) => {
    if (streakAtRisk) {
      if (a.streakCritical && !b.streakCritical) return -1;
      if (!a.streakCritical && b.streakCritical) return 1;
    }
    if ((b.xpReward ?? 0) !== (a.xpReward ?? 0)) return (b.xpReward ?? 0) - (a.xpReward ?? 0);
    return (b.carryOverCount ?? 0) - (a.carryOverCount ?? 0);
  });

  let slotsUsed = 0;
  for (const item of sorted) {
    const cost = Math.max(0.5, item.missionEquivalent ?? missionEquivalentFromEnergyRequired(item.energyCost));
    const wouldExceed = slotsUsed + cost > missionEquivalentCap;
    const isNearUnlock = item.skillLink && nearUnlockSkills.includes(item.skillLink);

    if (
      streakAtRisk &&
      (item.streakCritical || (critical.length === 0 && high_impact.length === 0))
    ) {
      critical.push(item);
      slotsUsed += cost;
    } else if (
      !wouldExceed &&
      (item.xpReward ?? 0) >= 80 &&
      high_impact.length < 3 &&
      (allowHeavyNow || !isHeavyTask(item))
    ) {
      high_impact.push(item);
      slotsUsed += cost;
    } else if (isNearUnlock && growth_boost.length < 2) {
      growth_boost.push(item);
      slotsUsed += cost;
    } else if (growth_boost.length < 3 && (item.skillLink || item.xpReward <= 50)) {
      growth_boost.push(item);
      slotsUsed += cost;
    } else if (high_impact.length < 4 && (allowHeavyNow || !isHeavyTask(item))) {
      high_impact.push(item);
      slotsUsed += cost;
    } else {
      growth_boost.push(item);
      slotsUsed += cost;
    }
  }

  return { critical, high_impact, growth_boost };
}

export { DEFAULT_MISSION_EQUIVALENT_CAP };
