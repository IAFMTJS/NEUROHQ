/**
 * Weekly Tactical Mode: stability, push, recovery, expansion.
 * Mode affects XP multipliers, failure penalties, suggestion bias, budget weight.
 * User may override 1× per week.
 */

export type WeeklyTacticalMode = "stability" | "push" | "recovery" | "expansion";

export interface WeeklyModeModifiers {
  xpMultiplier: number;
  failurePenaltyFactor: number;
  suggestionBias: "recovery" | "push" | "neutral" | "social";
  budgetIndexWeight: number;
}

const MODE_MODIFIERS: Record<WeeklyTacticalMode, WeeklyModeModifiers> = {
  stability: {
    xpMultiplier: 1,
    failurePenaltyFactor: 1,
    suggestionBias: "neutral",
    budgetIndexWeight: 1,
  },
  push: {
    xpMultiplier: 1.1,
    failurePenaltyFactor: 1.15,
    suggestionBias: "push",
    budgetIndexWeight: 1.1,
  },
  recovery: {
    xpMultiplier: 0.95,
    failurePenaltyFactor: 0.85,
    suggestionBias: "recovery",
    budgetIndexWeight: 0.9,
  },
  expansion: {
    xpMultiplier: 1.05,
    failurePenaltyFactor: 1,
    suggestionBias: "social",
    budgetIndexWeight: 1,
  },
};

export function getWeeklyModeModifiers(mode: WeeklyTacticalMode): WeeklyModeModifiers {
  return MODE_MODIFIERS[mode];
}

/** Determine suggested mode from performance (high burnout → recovery; high stability → push). */
export function determineWeeklyMode(params: {
  burnoutRisk: number;
  stabilityIndex: number;
  lastMode: WeeklyTacticalMode | null;
}): WeeklyTacticalMode {
  const { burnoutRisk, stabilityIndex, lastMode } = params;
  if (burnoutRisk >= 0.6) return "recovery";
  if (stabilityIndex >= 0.7 && (lastMode === "stability" || lastMode === null)) return "push";
  if (stabilityIndex < 0.4) return "stability";
  return lastMode ?? "stability";
}

export const WEEKLY_MODE_LABELS: Record<WeeklyTacticalMode, string> = {
  stability: "Stability Week",
  push: "Push Week",
  recovery: "Recovery Week",
  expansion: "Expansion Week",
};
