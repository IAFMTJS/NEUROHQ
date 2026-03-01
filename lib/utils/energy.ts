/** Base cost multiplier: energy_required (1–10) × this. Kept low so 3–5 small/medium tasks don't empty the budget. */
const TASK_COST_MULTIPLIER = 2.5;

/** Compute suggested task count from brain status. Tuned so a normal day (5,5,5,5,7h) gives ~4–5 tasks. */
export function getSuggestedTaskCount(input: {
  energy: number;
  focus: number;
  sensory_load: number;
  social_load: number;
  sleep_hours: number | null;
}): number {
  const { energy: e, focus: f, sensory_load: sensoryLoad, social_load: socialLoad, sleep_hours: sleep } = input;
  const baseScore = (e + f) / 2;
  const loadPenalty = (sensoryLoad / 10) * 1.5 + (socialLoad / 10) * 1.0;
  const sleepMod = sleep != null
    ? (sleep >= 8 ? 1.15 : sleep >= 7 ? 1.05 : sleep >= 6 ? 1.0 : sleep >= 5 ? 0.9 : 0.75)
    : 1.0;
  const raw = Math.max(1, (baseScore - loadPenalty) * sleepMod * 0.5 + 2.5);
  return Math.max(1, Math.min(8, Math.round(raw)));
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
