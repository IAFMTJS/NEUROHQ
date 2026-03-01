/**
 * Fase 3: Performance Rank (S/A/B/C) — score 0–100 from time, energy, focus, consistency.
 * S ≥90 → +15% XP, A ≥75 → +5%, B ≥60 → 0%, C <60 → -10%.
 */

export type PerformanceRank = "S" | "A" | "B" | "C";

export const RANK_XP_MULTIPLIER: Record<PerformanceRank, number> = {
  S: 1.15,
  A: 1.05,
  B: 1,
  C: 0.9,
};

export function getRankFromScore(score: number): PerformanceRank {
  if (score >= 90) return "S";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  return "C";
}

export function getXpMultiplierForRank(rank: PerformanceRank): number {
  return RANK_XP_MULTIPLIER[rank];
}

export type PerformanceScoreInput = {
  /** Task energy_required 1–10 */
  taskEnergy: number;
  /** Task focus_required 1–10 */
  taskFocus: number;
  /** Daily energy 1–10 (morning check-in) */
  dailyEnergy: number;
  /** Daily focus 1–10 */
  dailyFocus: number;
  /** Completed on due_date = 1, overdue = 0.7 */
  onTime: boolean;
  /** 0–1: e.g. completion rate last 7 days or 0.7 default */
  consistency: number;
};

/**
 * Score 0–100 from four factors (25% each):
 * - Time efficiency: on time vs overdue
 * - Energy efficiency: match task energy to daily energy (both high or both low = good)
 * - Focus stability: daily focus >= task focus
 * - Consistency: recent completion behaviour
 */
export function computePerformanceScore(input: PerformanceScoreInput): number {
  const {
    taskEnergy,
    taskFocus,
    dailyEnergy,
    dailyFocus,
    onTime,
    consistency,
  } = input;

  const timeEfficiency = onTime ? 1 : 0.7;
  const energyMatch = 1 - Math.min(1, Math.abs((taskEnergy / 10) - (dailyEnergy / 10)) * 1.2);
  const focusStability = dailyFocus >= taskFocus ? 1 : Math.max(0, 1 - (taskFocus - dailyFocus) / 10);
  const consistencyNorm = Math.max(0, Math.min(1, consistency));

  const raw =
    timeEfficiency * 25 +
    Math.max(0, energyMatch) * 25 +
    Math.max(0, focusStability) * 25 +
    consistencyNorm * 25;

  return Math.round(Math.max(0, Math.min(100, raw)));
}
