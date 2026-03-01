/**
 * Fase 8: Meta-progression ladder Recruit -> Operator -> Specialist -> Commander.
 * Unlock criteria and rank-specific rules.
 */

export type ProgressionRank = "recruit" | "operator" | "specialist" | "commander";

export const PROGRESSION_RANK_ORDER: ProgressionRank[] = ["recruit", "operator", "specialist", "commander"];

export function rankOrder(r: ProgressionRank): number {
  const i = PROGRESSION_RANK_ORDER.indexOf(r);
  return i >= 0 ? i : 0;
}

export function nextRank(current: ProgressionRank): ProgressionRank | null {
  const i = PROGRESSION_RANK_ORDER.indexOf(current);
  if (i < 0 || i >= PROGRESSION_RANK_ORDER.length - 1) return null;
  return PROGRESSION_RANK_ORDER[i + 1] ?? null;
}

/** Unlock criteria per next rank (minimums). */
export interface UnlockCriteria {
  minTotalXp: number;
  minStreak: number;
  minCompletionRate7d: number; // 0-1
  minWeeklyPerformanceIndex?: number; // 0-100
}

export const UNLOCK_CRITERIA: Record<ProgressionRank, UnlockCriteria | null> = {
  recruit: null, // already at start
  operator: { minTotalXp: 500, minStreak: 3, minCompletionRate7d: 0.5 },
  specialist: { minTotalXp: 2000, minStreak: 7, minCompletionRate7d: 0.6, minWeeklyPerformanceIndex: 50 },
  commander: { minTotalXp: 5000, minStreak: 14, minCompletionRate7d: 0.7, minWeeklyPerformanceIndex: 65 },
};

/** Criteria to unlock the *next* rank from current. */
export function getUnlockCriteriaForNextRank(current: ProgressionRank): UnlockCriteria | null {
  const next = nextRank(current);
  if (!next) return null;
  return UNLOCK_CRITERIA[next] ?? null;
}

/** Rank-specific: penalty variance (higher rank = stricter). */
export function getPenaltyVarianceMultiplier(rank: ProgressionRank): number {
  switch (rank) {
    case "recruit": return 0.8;
    case "operator": return 1;
    case "specialist": return 1.1;
    case "commander": return 1.2;
    default: return 1;
  }
}

/** Rank-specific: XP modifier (Commander gets slightly more). */
export function getXpMultiplierForProgressionRank(rank: ProgressionRank): number {
  switch (rank) {
    case "recruit": return 1;
    case "operator": return 1;
    case "specialist": return 1.05;
    case "commander": return 1.1;
    default: return 1;
  }
}

/** Energy impact multiplier (higher rank = more impact from poor choices). */
export function getEnergyImpactMultiplier(rank: ProgressionRank): number {
  switch (rank) {
    case "recruit": return 0.9;
    case "operator": return 1;
    case "specialist": return 1.05;
    case "commander": return 1.1;
    default: return 1;
  }
}
