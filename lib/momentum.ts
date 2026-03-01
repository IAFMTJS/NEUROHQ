/**
 * Momentum score 0–100: consistency last 7 days, completion rate, missed streak penalties.
 * Used for dashboard "status" (green/orange/red) and XP multipliers.
 */

export type MomentumBand = "low" | "medium" | "high";

/** Colour band for UI (green / orange / red). */
export function momentumBand(score: number): MomentumBand {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/** Compute momentum from: last 7 days active, completion rate, streak missed penalty. */
export function computeMomentumScore(params: {
  /** Days in last 7 that had at least one completion. */
  activeDaysLast7: number;
  /** Total completions in last 7 days. */
  completionsLast7: number;
  /** Expected or target completions in last 7 (e.g. 7 if daily goal). */
  targetCompletionsLast7: number;
  /** Whether user missed yesterday (streak break risk). */
  missedYesterday: boolean;
  /** Current streak (for bonus). */
  currentStreak: number;
}): number {
  const {
    activeDaysLast7,
    completionsLast7,
    targetCompletionsLast7,
    missedYesterday,
    currentStreak,
  } = params;

  // Consistency: 0–40 points (active days / 7)
  const consistencyScore = Math.min(40, (activeDaysLast7 / 7) * 40);

  // Completion rate: 0–40 points (completions / target, capped)
  const target = Math.max(1, targetCompletionsLast7);
  const completionRate = Math.min(1, completionsLast7 / target);
  const completionScore = completionRate * 40;

  // Streak bonus: 0–15 points (longer streak = more)
  const streakBonus = Math.min(15, currentStreak * 3);

  // Missed yesterday penalty: -15
  const missedPenalty = missedYesterday ? 15 : 0;

  const raw = consistencyScore + completionScore + streakBonus - missedPenalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
