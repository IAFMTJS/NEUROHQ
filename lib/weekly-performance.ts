/**
 * Fase 7: 7-day Performance Index and adaptive modifiers.
 */

export type PerformanceRank = "S" | "A" | "B" | "C";

export function rankToNumeric(rank: PerformanceRank | null | undefined): number | null {
  if (!rank) return null;
  const map: Record<PerformanceRank, number> = { S: 4, A: 3, B: 2, C: 1 };
  return map[rank] ?? null;
}

export function compute7DayPerformanceIndex(
  completionRate: number,
  avgRankNumeric: number | null,
  consistencyDays: number
): number {
  const completionScore = Math.round(completionRate * 40);
  const rankScore = avgRankNumeric != null ? Math.round((avgRankNumeric / 4) * 35) : 0;
  const consistencyScore = Math.round((consistencyDays / 7) * 25);
  return Math.min(100, Math.max(0, completionScore + rankScore + consistencyScore));
}

export function getAdaptiveModifiers(performanceIndex: number): {
  difficultyMultiplier: number;
  rewardMultiplier: number;
  recoveryEmphasis: boolean;
} {
  if (performanceIndex >= 70) {
    return { difficultyMultiplier: 1.1, rewardMultiplier: 1.1, recoveryEmphasis: false };
  }
  if (performanceIndex < 40) {
    return { difficultyMultiplier: 0.9, rewardMultiplier: 1, recoveryEmphasis: true };
  }
  return { difficultyMultiplier: 1, rewardMultiplier: 1, recoveryEmphasis: false };
}

export type Fase7PatternType =
  | "monday_avoidance"
  | "high_focus_avoidance"
  | "social_overload"
  | "cancels_above_threshold";
