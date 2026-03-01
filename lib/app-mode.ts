/** App mode used by dashboard / today engine. */
export type AppMode = "normal" | "low_energy" | "high_sensory" | "driven" | "stabilize";

/** Minimal daily state shape needed to compute mode (avoids refetch when already loaded). */
export type DailyStateForMode = { energy?: number | null; focus?: number | null; sensory_load?: number | null } | null;

/** Compute mode from pre-fetched state and carryOverCount. Use when state/carryOverCount already loaded. */
export function getModeFromState(state: DailyStateForMode, carryOverCount: number): AppMode {
  if (carryOverCount >= 5) return "stabilize";

  const energy = state?.energy ?? null;
  const focus = state?.focus ?? null;
  const sensory = state?.sensory_load ?? null;

  if (energy !== null && energy <= 4) return "low_energy";
  if (sensory !== null && sensory >= 7) return "high_sensory";
  if (energy !== null && focus !== null && energy >= 7 && focus >= 7) return "driven";

  return "normal";
}
