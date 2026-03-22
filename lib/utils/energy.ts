import {
  bandFor10Scale,
  bandForSleepHours,
  getMissionCountRangeForEnergyBand,
  getSleepScoreMultiplier,
} from "@/lib/behavioral-engine";
import { missionFloorForEnergy, type MissionEngineTuning } from "@/lib/strategy/engine-params";

/** Base cost multiplier: energy_required (1–10) × this. Kept low so 3–5 small/medium tasks don't empty the budget. */
const TASK_COST_MULTIPLIER = 2.5;

/**
 * Aanbevolen aantal missies op basis van energy-band, fysieke limiet en slaap (brainstatus-modifier).
 * Laag 1–2, gemiddeld 2–3, goed 4–5, uiterst 6 — daarna × slaap-multiplier, begrensd door energy-max.
 */
export function getSuggestedTaskCount(
  input: {
    energy: number;
    focus: number;
    sensory_load: number;
    social_load: number;
    sleep_hours: number | null;
    physical_health?: number | null;
  },
  missionEngine?: MissionEngineTuning | null
): number {
  const { energy: e, sleep_hours: sleep, physical_health: phys } = input;
  const energyBand = bandFor10Scale(e);
  const { max: energyMax } = getMissionCountRangeForEnergyBand(energyBand);

  let base =
    energyBand === "low" ? 2 : energyBand === "medium" ? 3 : energyBand === "good" ? 4 : energyBand === "ultra" ? 6 : 3;

  const physBand = bandFor10Scale(phys ?? null);
  if (physBand === "low") base = Math.min(base, 2);
  if (physBand === "medium") base = Math.min(base, 3);

  const sleepMult = getSleepScoreMultiplier(bandForSleepHours(sleep));
  let n = Math.round(base * sleepMult);
  n = Math.max(1, Math.min(8, n));
  if (!missionEngine) {
    n = Math.min(n, energyMax);
  } else {
    const floor = missionFloorForEnergy(e, missionEngine);
    n = Math.max(n, floor);
    n = Math.min(8, n);
  }
  return n;
}

/** How task cost splits across Energy : Focus : Load. */
export function splitTaskCost(energyRequired: number): { energy: number; focus: number; load: number } {
  const raw = energyRequired * TASK_COST_MULTIPLIER;
  return {
    energy: Math.round(raw * 0.5),
    focus: Math.round(raw * 0.35),
    load: Math.round(raw * 0.15),
  };
}

/** Total task cost (for validation). */
export function taskCost(energyRequired: number): number {
  return energyRequired * TASK_COST_MULTIPLIER;
}
