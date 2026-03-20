/** App mode used by dashboard / today engine. */
import { bandFor10Scale, bandForSleepHours } from "@/lib/behavioral-engine";

export type AppMode = "normal" | "low_energy" | "high_sensory" | "driven" | "stabilize";

/** Minimal daily state shape needed to compute mode (avoids refetch when already loaded). */
export type DailyStateForMode = {
  energy?: number | null;
  focus?: number | null;
  sensory_load?: number | null;
  sleep_hours?: number | null;
} | null;

/**
 * `high_sensory` = lage sensory-score (0–3): weinig ruimte voor prikkels/stretch — zelfde bedoeling als “minimal mode”.
 * `driven` = energy én focus in de goede/uiterst-goede band (7–10 schaal).
 */
export function getModeFromState(state: DailyStateForMode, carryOverCount: number): AppMode {
  if (carryOverCount >= 5) return "stabilize";

  const sleepBand = bandForSleepHours(state?.sleep_hours ?? null);
  if (sleepBand === "low") return "low_energy";

  const energyBand = bandFor10Scale(state?.energy ?? null);
  const focusBand = bandFor10Scale(state?.focus ?? null);
  const sensoryBand = bandFor10Scale(state?.sensory_load ?? null);

  if (energyBand === "low") return "low_energy";
  if (sensoryBand === "low") return "high_sensory";
  if (
    (energyBand === "good" || energyBand === "ultra") &&
    (focusBand === "good" || focusBand === "ultra")
  ) {
    return "driven";
  }

  return "normal";
}
