export type BrainState = "PEAK" | "OPTIMAL" | "LIMITED" | "DRAINED" | "CRASH";

/** 0–3 laag, 4–6 gemiddeld, 7–8 goed, 9–10 uiterst goed (10-punts schaal). */
export type StatBand = "low" | "medium" | "good" | "ultra";

export type BehavioralStatsInput = {
  energy?: number | null;
  focus?: number | null;
  mentalBattery?: number | null;
  mentalLoad?: number | null;
  physicalHealth?: number | null;
  sleepHours?: number | null;
};

export type NormalizedBehavioralStats = {
  energy: number;
  focus: number;
  battery: number;
  load: number;
  physical: number;
  /** Lineaire 0–1 (uur/12) — alleen voor legacy/compat; brain score gebruikt sleepMultiplier. */
  sleep: number;
  sleepBand: StatBand;
  /** Slaap-effect op brainstatus: laag −40%, gem. −20%, goed 0%, uiterst +20%. */
  sleepMultiplier: number;
  bands: {
    energy: StatBand;
    focus: StatBand;
    battery: StatBand;
    load: StatBand;
    physical: StatBand;
  };
};

export type BehavioralConstraints = {
  /** Lage physical_health: geen zware / veel-beweging-taken. */
  blockPhysical: boolean;
  /** Gemiddeld physical_health: max één zwaardere fysieke missie. */
  limitPhysicalTasks: boolean;
  /** Uiterst goed physical_health: voorrang op beweging (UI / ranking). */
  preferPhysical: boolean;
  /** Lage mental battery: vermijd sociale interactie-taken. */
  avoidSocialInteraction: boolean;
  /** Gemiddeld mental battery: geen zware sociale taken; lichte interactie ok. */
  limitSocialTasks: boolean;
  /** Lage sensory/mentale belasting: geen “karakter-stretch” / zware exposure. */
  blockCharacterStretch: boolean;
  /** Gemiddeld: stretch alleen gekaderd. */
  limitCharacterStretch: boolean;
  preferCharacterStretch: boolean;
  /** Zeer lage battery: blokkeer zware cognitieve taken (noodrem). */
  blockHeavyCognitive: boolean;
  forceRecovery: boolean;
};

export type EffectiveBehavioralStats = NormalizedBehavioralStats & {
  effectiveBattery: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeStat(raw: number | null | undefined, max: number): number {
  if (raw == null) return 0.5;
  return clamp01(raw / max);
}

function clamp1To10(value: number): number {
  return Math.max(1, Math.min(10, value));
}

/**
 * `daily_state.load` is primarily a 0-100 pressure score.
 * Older flows may still pass 1-10 values. This helper accepts both.
 */
export function normalizeSystemLoadToTenScale(load: number | null | undefined): number | null {
  if (load == null || !Number.isFinite(load)) return null;
  const n = Number(load);
  if (n <= 10) return clamp1To10(n);
  return clamp1To10(n / 10);
}

/**
 * Resolve one canonical 1-10 mental load for the behavioral engine.
 * Preference: system pressure (`load`) -> sensory check-in (`sensory_load`) -> fallback.
 */
export function resolveMentalLoad1To10(input: {
  systemLoad?: number | null;
  sensoryLoad?: number | null;
  fallback?: number;
}): number {
  const fromSystem = normalizeSystemLoadToTenScale(input.systemLoad ?? null);
  if (fromSystem != null) return fromSystem;
  if (input.sensoryLoad != null && Number.isFinite(input.sensoryLoad)) {
    return clamp1To10(Number(input.sensoryLoad));
  }
  return clamp1To10(input.fallback ?? 5);
}

/** 10-punts schaal: laag / gemiddeld / goed / uiterst goed. */
export function bandFor10Scale(raw: number | null | undefined): StatBand {
  if (raw == null) return "medium";
  const v = Math.max(0, Math.min(10, raw));
  if (v <= 3) return "low";
  if (v <= 6) return "medium";
  if (v <= 8) return "good";
  return "ultra";
}

/**
 * Slaapuren: &lt;6 laag, 6–7 gemiddeld, 7–9 goed, 9+ uiterst goed.
 * Grens 6 uur: telt als gemiddeld (6–7-band), niet als “laag”.
 */
export function bandForSleepHours(hours: number | null | undefined): StatBand {
  if (hours == null || !Number.isFinite(hours)) return "medium";
  const h = Math.max(0, hours);
  if (h < 6) return "low";
  if (h < 7) return "medium";
  if (h < 9) return "good";
  return "ultra";
}

export function getSleepScoreMultiplier(band: StatBand): number {
  switch (band) {
    case "low":
      return 0.6;
    case "medium":
      return 0.8;
    case "good":
      return 1.0;
    case "ultra":
      return 1.2;
    default:
      return 1.0;
  }
}

/**
 * Energie → aanbevolen missies (equivalente slots, niet gewogen met mini=groot).
 * Laag: max 2 totaal; 1 auto of 2 kleine / 1 grote — hier als plafond 2.
 */
export function getMissionCountRangeForEnergyBand(band: StatBand): { min: number; max: number } {
  switch (band) {
    case "low":
      return { min: 1, max: 2 };
    case "medium":
      return { min: 2, max: 3 };
    case "good":
      return { min: 4, max: 5 };
    case "ultra":
      return { min: 6, max: 6 };
    default:
      return { min: 2, max: 4 };
  }
}

/**
 * Taakgrootte → missie-equivalent: mini ½, klein/extreem 1, groot 2 (proxy via energy_required).
 */
export function missionEquivalentFromEnergyRequired(energyRequired: number | null | undefined): number {
  const e = energyRequired ?? 5;
  if (e <= 2) return 0.5;
  if (e <= 8) return 1;
  return 2;
}

/**
 * Pure normalization: ruwe waarden naar 0..1 + bands.
 */
export function normalizeBehavioralStats(stats: BehavioralStatsInput): NormalizedBehavioralStats {
  const sleepH = stats.sleepHours ?? null;
  const sleepBand = bandForSleepHours(sleepH);
  const sleepMultiplier = getSleepScoreMultiplier(sleepBand);

  const e = stats.energy;
  const f = stats.focus;
  const b = stats.mentalBattery;
  const l = stats.mentalLoad;
  const p = stats.physicalHealth;

  return {
    energy: normalizeStat(e, 10),
    focus: normalizeStat(f, 10),
    battery: normalizeStat(b, 10),
    load: normalizeStat(l, 10),
    physical: normalizeStat(p, 10),
    sleep: normalizeStat(sleepH != null ? Math.min(12, Math.max(0, sleepH)) : 7, 12),
    sleepBand,
    sleepMultiplier,
    bands: {
      energy: bandFor10Scale(e),
      focus: bandFor10Scale(f),
      battery: bandFor10Scale(b),
      load: bandFor10Scale(l),
      physical: bandFor10Scale(p),
    },
  };
}

export function getBehavioralConstraints(n: NormalizedBehavioralStats): BehavioralConstraints {
  const { bands } = n;
  const eb = n.battery;
  const ee = n.energy;

  return {
    blockPhysical: bands.physical === "low",
    limitPhysicalTasks: bands.physical === "medium",
    preferPhysical: bands.physical === "ultra",
    avoidSocialInteraction: bands.battery === "low",
    limitSocialTasks: bands.battery === "medium",
    // Load is burden: high load should restrict stretch work.
    blockCharacterStretch: bands.load === "good" || bands.load === "ultra",
    limitCharacterStretch: bands.load === "medium",
    preferCharacterStretch: bands.load === "low",
    blockHeavyCognitive: eb < 0.25,
    forceRecovery: eb < 0.2 || ee < 0.2,
  };
}

export function getEffectiveBehavioralStats(n: NormalizedBehavioralStats): EffectiveBehavioralStats {
  const effectiveBattery = n.battery - n.load * 0.5;
  return {
    ...n,
    effectiveBattery: clamp01(effectiveBattery),
  };
}

/**
 * Intrinsieke score uit energy, focus, effectieve battery, physical;
 * slaap vermenigvuldigt het geheel (−40% / −20% / 0 / +20%).
 */
export function getBrainState(e: EffectiveBehavioralStats): BrainState {
  const intrinsic =
    e.energy * 0.25 + e.focus * 0.25 + e.effectiveBattery * 0.35 + e.physical * 0.15;
  const score = intrinsic * e.sleepMultiplier;

  if (score >= 0.75) return "PEAK";
  if (score >= 0.55) return "OPTIMAL";
  if (score >= 0.35) return "LIMITED";
  if (score >= 0.2) return "DRAINED";
  return "CRASH";
}

export function getBrainStateMultiplier(state: BrainState): number {
  switch (state) {
    case "PEAK":
      return 1.3;
    case "OPTIMAL":
      return 1.0;
    case "LIMITED":
      return 0.85;
    case "DRAINED":
      return 0.6;
    case "CRASH":
      return 0.3;
    default:
      return 1;
  }
}

/** DCIC war / recovery: server + UI suggest; niet afgedwongen (behalve war/recovery via autoModeCheck bij geldige brain-composite). */
export type DcicModeSuggestion = "war" | "recovery" | null;

/**
 * Welke DCIC-modus past bij brain status:
 * - **recovery**: uitgeput, slaaptekort, lage energy, of lage battery.
 * - **war**: PEAK/OPTIMAL + energy/focus/load allemaal “goed” of uiterst (hoge uitvoercapaciteit).
 */
export function deriveDcicSuggestedMode(input: {
  normalized: NormalizedBehavioralStats;
  effective: EffectiveBehavioralStats;
  brainState: BrainState;
  constraints: BehavioralConstraints;
}): DcicModeSuggestion {
  const { normalized, brainState, constraints } = input;
  const { bands, sleepBand } = normalized;

  const wantsRecovery =
    brainState === "CRASH" ||
    brainState === "DRAINED" ||
    constraints.forceRecovery ||
    bands.energy === "low" ||
    sleepBand === "low" ||
    bands.battery === "low" ||
    bands.load === "good" ||
    bands.load === "ultra";

  if (wantsRecovery) return "recovery";

  const loadAllowsWar = bands.load === "low" || bands.load === "medium";
  const wantsWar =
    (brainState === "PEAK" || brainState === "OPTIMAL") &&
    (bands.energy === "good" || bands.energy === "ultra") &&
    (bands.focus === "good" || bands.focus === "ultra") &&
    loadAllowsWar;

  if (wantsWar) return "war";

  return null;
}

/** Consequence-engine: recovery-first (naast load/burnout). */
export function brainSignalsRecoveryPriority(input: {
  normalized: NormalizedBehavioralStats;
  brainState: BrainState;
  constraints: BehavioralConstraints;
}): boolean {
  const { normalized, brainState, constraints } = input;
  if (brainState === "CRASH" || brainState === "DRAINED") return true;
  if (constraints.forceRecovery) return true;
  if (normalized.bands.energy === "low") return true;
  if (normalized.sleepBand === "low") return true;
  if (normalized.bands.battery === "low") return true;
  return false;
}
