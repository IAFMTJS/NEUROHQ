"use server";

import { getDailyState } from "./daily-state";
import { getCarryOverCountForDate } from "./tasks";

export type AppMode = "normal" | "low_energy" | "high_sensory" | "driven" | "stabilize";

export async function getMode(date: string): Promise<AppMode> {
  const [state, carryOverCount] = await Promise.all([
    getDailyState(date),
    getCarryOverCountForDate(date),
  ]);

  if (carryOverCount >= 5) return "stabilize";

  const energy = state?.energy ?? null;
  const focus = state?.focus ?? null;
  const sensory = state?.sensory_load ?? null;

  if (energy !== null && energy <= 4) return "low_energy";
  if (sensory !== null && sensory >= 7) return "high_sensory";
  if (energy !== null && focus !== null && energy >= 7 && focus >= 7) return "driven";

  return "normal";
}
