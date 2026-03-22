/**
 * D.3 — Adaptive training (phase 1 stub): maps brain aggregates to a suggested difficulty tier.
 * Full weekly lock + session scaling hooks into Growth hero / missions in later phases.
 */
export type DifficultyTier = "easy" | "medium" | "hard";

export type WeeklyLockPhase = "mon_tue" | "wed_sun";

export function weeklyDifficultyFromBrain(input: {
  energyAvg: number | null;
  focusAvg: number | null;
  brainLogged: boolean;
}): { tier: DifficultyTier; lockedPhase: WeeklyLockPhase } {
  if (!input.brainLogged) {
    return { tier: "medium", lockedPhase: "mon_tue" };
  }
  const score = ((input.energyAvg ?? 50) + (input.focusAvg ?? 50)) / 2;
  const tier: DifficultyTier = score >= 65 ? "hard" : score >= 40 ? "medium" : "easy";
  return { tier, lockedPhase: "wed_sun" };
}
