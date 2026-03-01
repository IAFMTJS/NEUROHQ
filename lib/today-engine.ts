/**
 * Today Engine: categorize today's items into Critical | High Impact | Growth Boost.
 * The app decides, not the user — behavioural steering.
 */

export type TodayBucket = "critical" | "high_impact" | "growth_boost";

export interface TodayItem {
  id: string;
  title: string;
  /** 1–5 energy cost (for cap 10/day). */
  energyCost: number;
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

const DEFAULT_ENERGY = 2;
const DEFAULT_XP = 50;

/** Map raw task to TodayItem. Pure, runs on client or server. */
export function rawTaskToTodayItem(
  raw: RawTodayTask,
  index: number,
  streakAtRisk: boolean
): TodayItem {
  const energy = Math.min(5, Math.max(1, raw.energy_required ?? DEFAULT_ENERGY));
  const xp = Math.max(10, Math.min(100, (raw.impact ?? 5) * 15)) || DEFAULT_XP;
  const item: TodayItem = {
    id: raw.id,
    title: raw.title ?? "Task",
    energyCost: energy,
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

const ENERGY_CAP = 10;

/**
 * Bucket today's items into Critical (streak risk), High Impact (most XP), Growth Boost (unlock progress).
 * Order within bucket: critical first by carryOver then by xp; high_impact by xp desc; growth_boost by skill progress relevance.
 */
export function bucketTodayItems(
  items: TodayItem[],
  options: {
    /** If true, no completion yesterday → first tasks are "critical" for streak. */
    streakAtRisk: boolean;
    /** Skill keys close to unlock (e.g. 80% there) — prioritize those in growth_boost. */
    nearUnlockSkills?: string[];
    /**
     * Whether heavy missions (energyCost ≥ 4) are allowed in Critical/High Impact right now,
     * based on energy pattern & time windows. If false, heavy items worden naar Growth Boost geduwd.
     */
    allowHeavyNow?: boolean;
  }
): BucketedToday {
  const { streakAtRisk, nearUnlockSkills = [], allowHeavyNow = true } = options;
  const critical: TodayItem[] = [];
  const high_impact: TodayItem[] = [];
  const growth_boost: TodayItem[] = [];

  const isHeavyTask = (item: TodayItem) => {
    const cost = Math.min(5, Math.max(1, item.energyCost ?? DEFAULT_ENERGY));
    return cost >= 4;
  };

  // Sort by: streak-critical first, then by XP desc, then by carry-over
  const sorted = [...items].sort((a, b) => {
    if (streakAtRisk) {
      if (a.streakCritical && !b.streakCritical) return -1;
      if (!a.streakCritical && b.streakCritical) return 1;
    }
    if ((b.xpReward ?? 0) !== (a.xpReward ?? 0)) return (b.xpReward ?? 0) - (a.xpReward ?? 0);
    return (b.carryOverCount ?? 0) - (a.carryOverCount ?? 0);
  });

  let energyUsed = 0;
  for (const item of sorted) {
    const cost = Math.min(5, Math.max(1, item.energyCost));
    const wouldExceed = energyUsed + cost > ENERGY_CAP;
    const isNearUnlock = item.skillLink && nearUnlockSkills.includes(item.skillLink);

    if (
      streakAtRisk &&
      (item.streakCritical || (critical.length === 0 && high_impact.length === 0))
    ) {
      critical.push(item);
      energyUsed += cost;
    } else if (
      !wouldExceed &&
      (item.xpReward ?? 0) >= 80 &&
      high_impact.length < 3 &&
      (allowHeavyNow || !isHeavyTask(item))
    ) {
      high_impact.push(item);
      energyUsed += cost;
    } else if (isNearUnlock && growth_boost.length < 2) {
      growth_boost.push(item);
      energyUsed += cost;
    } else if (growth_boost.length < 3 && (item.skillLink || item.xpReward <= 50)) {
      growth_boost.push(item);
      energyUsed += cost;
    } else if (high_impact.length < 4 && (allowHeavyNow || !isHeavyTask(item))) {
      high_impact.push(item);
      energyUsed += cost;
    } else {
      growth_boost.push(item);
    }
  }

  return { critical, high_impact, growth_boost };
}

export { ENERGY_CAP };
