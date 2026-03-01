export type HeadroomTier = "High" | "Medium" | "Low";
export type BrainRisk = "Low" | "Medium" | "High";
export type BrainModeLabel = "Stable" | "Driven" | "Cautious" | "LowEnergy";

export type TaskIntensity = "light" | "medium" | "heavy";

function scale1To10ToPct(value: number | null | undefined): number {
  if (value == null) return 50;
  return Math.round((value / 10) * 100);
}

/** Focus slots = how many active missions you may carry at once. */
export function getFocusSlots(focus1to10: number | null | undefined): number {
  const focusPct = scale1To10ToPct(focus1to10 ?? null);
  return Math.max(1, Math.floor(focusPct / 30));
}

export function getHeadroomTier(headroom: number): HeadroomTier {
  if (headroom >= 30) return "High";
  if (headroom >= 15) return "Medium";
  return "Low";
}

export function getBrainRisk(loadPct: number): BrainRisk {
  if (loadPct > 80) return "High";
  if (loadPct > 70) return "Medium";
  return "Low";
}

/**
 * effectiveStress = load - (mentalBattery * 5).
 * load in 0–100, mentalBattery 1–10. High value → failure chance up, XP mult down, suggest recovery.
 */
export function getEffectiveStress(loadPct: number, mentalBattery: number | null | undefined): number {
  const battery = mentalBattery ?? 5;
  return loadPct - battery * 5;
}

export function shouldSuggestRecovery(effectiveStress: number): boolean {
  return effectiveStress > 40;
}

export function maxAllowedIntensityForTier(tier: HeadroomTier): TaskIntensity {
  if (tier === "High") return "heavy";
  if (tier === "Medium") return "medium";
  return "light";
}

export function classifyIntensity(energyRequired: number | null | undefined): TaskIntensity {
  const e = energyRequired ?? 5;
  if (e <= 3) return "light";
  if (e <= 6) return "medium";
  return "heavy";
}

/** Whether task is heavy (energy_required >= 7 or classifyIntensity === "heavy"). */
export function isHeavyTask(energyRequired: number | null | undefined): boolean {
  return classifyIntensity(energyRequired) === "heavy";
}

export function isEnergyAllowedForTier(energyRequired: number | null | undefined, tier: HeadroomTier): boolean {
  const intensity = classifyIntensity(energyRequired);
  const maxIntensity = maxAllowedIntensityForTier(tier);
  const order: Record<TaskIntensity, number> = { light: 0, medium: 1, heavy: 2 };
  return order[intensity] <= order[maxIntensity];
}

export function getMaxSlotsWithLoadRule(focusSlots: number, loadPct: number): number {
  if (loadPct > 70) return 1;
  return focusSlots;
}

export function getBrainModeLabel(params: {
  energy: number | null | undefined;
  focus: number | null | undefined;
  sensory_load: number | null | undefined;
}): BrainModeLabel {
  const energyPct = scale1To10ToPct(params.energy ?? null);
  const focusPct = scale1To10ToPct(params.focus ?? null);
  const loadPct = scale1To10ToPct(params.sensory_load ?? null);

  if (energyPct < 40) return "LowEnergy";
  if (energyPct >= 70 && focusPct >= 70 && loadPct < 70) return "Driven";
  if (loadPct >= 70) return "Cautious";
  return "Stable";
}

export type BrainMode = {
  mode: BrainModeLabel;
  focusSlots: number;
  maxSlots: number;
  tier: HeadroomTier;
  risk: BrainRisk;
  /** How many heavy missions are allowed per slot (0 = none). */
  maxHeavyPerSlot: number;
  /** When true, no new missions should be added for this day due to very high load. */
  addBlocked: boolean;
  /** load - (mentalBattery * 5); high → suggest recovery, lower XP mult. */
  effectiveStress: number;
  /** When true, show recovery missions / rest suggestion. */
  suggestRecovery: boolean;
};

export function computeBrainMode(params: {
  energy: number | null | undefined;
  focus: number | null | undefined;
  sensory_load: number | null | undefined;
  headroom: number;
  /** 0–100 accumulated pressure; when null, derived from sensory_load * 10. */
  load?: number | null;
  /** 1–10 social/emotional buffer. */
  mental_battery?: number | null;
}): BrainMode {
  const focusSlots = getFocusSlots(params.focus ?? null);
  const loadPct = params.load ?? scale1To10ToPct(params.sensory_load ?? null);
  const maxSlots = getMaxSlotsWithLoadRule(focusSlots, loadPct);
  const tier = getHeadroomTier(params.headroom);
  const risk = getBrainRisk(loadPct);
  const maxHeavyPerSlot = tier === "High" ? 1 : 0;
  const addBlocked = loadPct > 80;
  const effectiveStress = getEffectiveStress(loadPct, params.mental_battery);
  const suggestRecovery = shouldSuggestRecovery(effectiveStress);
  return {
    mode: getBrainModeLabel({
      energy: params.energy,
      focus: params.focus,
      sensory_load: params.sensory_load,
    }),
    focusSlots,
    maxSlots,
    tier,
    risk,
    maxHeavyPerSlot,
    addBlocked,
    effectiveStress,
    suggestRecovery,
  };
}

