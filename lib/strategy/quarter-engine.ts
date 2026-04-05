/**
 * Quarter Strategy Engine — single score (0–100) from four pillars + pressure band + modifiers.
 * Pure functions; data loading lives in `quarter-engine-snapshot` server action.
 */

export type StrategicPressure = "relaxed" | "normal" | "pressure";

export type QuarterPillarScore = {
  /** 0–1 contribution after neutral handling */
  value01: number;
  /** User-facing 0–100 for this pillar */
  displayPct: number;
  /** Has an explicit quarterly commitment */
  committed: boolean;
};

export type QuarterEngineModifiers = {
  xpMultiplier: number;
  maxSkipsPerDay: number;
  extraMissionFloorDelta: number;
  budgetNoSpendRecommended: boolean;
};

const NEUTRAL = 0.5;

export function strategicPressureFromScore01(score01: number): StrategicPressure {
  if (score01 >= 0.85) return "relaxed";
  if (score01 >= 0.6) return "normal";
  return "pressure";
}

export function legacyZoneFromStrategicPressure(p: StrategicPressure): "comfort" | "healthy" | "risk" {
  if (p === "relaxed") return "comfort";
  if (p === "normal") return "healthy";
  return "risk";
}

export function pressureMeterFromScorePct(scorePct: number): number {
  const s = Math.max(0, Math.min(100, scorePct));
  return Math.max(0, Math.min(2, (100 - s) / 50));
}

function growthComponent(
  targetPct: number | null,
  actualPct: number | null
): QuarterPillarScore {
  if (targetPct == null || targetPct <= 0) {
    return { value01: NEUTRAL, displayPct: 50, committed: false };
  }
  /** Geen echte meting (geen protocol / geen pacing) — niet straffen met 0%. */
  if (actualPct == null) {
    return { value01: NEUTRAL, displayPct: 50, committed: false };
  }
  const ratio = Math.min(1, actualPct / targetPct);
  return {
    value01: ratio,
    displayPct: Math.round(ratio * 100),
    committed: true,
  };
}

function ratioComponent(numerator: number, denominator: number): QuarterPillarScore {
  if (denominator <= 0) {
    return { value01: NEUTRAL, displayPct: 50, committed: false };
  }
  const ratio = Math.min(1, Math.max(0, numerator / denominator));
  return {
    value01: ratio,
    displayPct: Math.round(ratio * 100),
    committed: true,
  };
}

function disciplineComponent(completed: number, skipRescheduleDelete: number): QuarterPillarScore {
  const denom = completed + skipRescheduleDelete;
  if (denom <= 0) {
    return { value01: NEUTRAL, displayPct: 50, committed: false };
  }
  const ratio = Math.min(1, Math.max(0, completed / denom));
  return {
    value01: ratio,
    displayPct: Math.round(ratio * 100),
    committed: true,
  };
}

export type QuarterEngineInputs = {
  growthTargetPct: number | null;
  growthActualPct: number | null;
  savingsTargetCents: number | null;
  savedThisQuarterCents: number | null;
  xpTargetEarned: number | null;
  xpEarnedThisQuarter: number | null;
  disciplineCompleted: number;
  disciplineNegative: number;
  /** Overschrijft `disciplineComponent` wanneer gezet (gedragsfocus op missies). */
  disciplineOverride?: QuarterPillarScore | null;
};

export type QuarterEngineResult = {
  strategyScorePct: number;
  strategicPressure: StrategicPressure;
  legacyZone: "comfort" | "healthy" | "risk";
  pressureMeter: number;
  growth: QuarterPillarScore;
  budget: QuarterPillarScore;
  xp: QuarterPillarScore;
  discipline: QuarterPillarScore;
  modifiers: QuarterEngineModifiers;
};

export function computeQuarterEngine(inputs: QuarterEngineInputs): QuarterEngineResult {
  const growth = growthComponent(inputs.growthTargetPct, inputs.growthActualPct);
  let budget: QuarterPillarScore;
  if (inputs.savingsTargetCents == null || inputs.savingsTargetCents <= 0) {
    budget = { value01: NEUTRAL, displayPct: 50, committed: false };
  } else if (inputs.savedThisQuarterCents == null) {
    /** Doel gezet maar nog geen spaarlogboek in deze periode — geen valse 0%. */
    budget = { value01: NEUTRAL, displayPct: 50, committed: false };
  } else {
    budget = ratioComponent(Math.max(0, inputs.savedThisQuarterCents), inputs.savingsTargetCents);
  }

  let xp: QuarterPillarScore;
  if (inputs.xpTargetEarned == null || inputs.xpTargetEarned <= 0) {
    xp = { value01: NEUTRAL, displayPct: 50, committed: false };
  } else {
    xp = ratioComponent(
      Math.max(0, inputs.xpEarnedThisQuarter ?? 0),
      inputs.xpTargetEarned
    );
  }

  const discipline =
    inputs.disciplineOverride ??
    disciplineComponent(inputs.disciplineCompleted, inputs.disciplineNegative);

  const strategyScorePct = Math.round(
    100 * (growth.value01 + budget.value01 + xp.value01 + discipline.value01) / 4
  );
  const score01 = strategyScorePct / 100;
  let strategicPressure = strategicPressureFromScore01(score01);
  const legacyZone = legacyZoneFromStrategicPressure(strategicPressure);
  const pressureMeter = pressureMeterFromScorePct(strategyScorePct);

  const budgetLow = budget.committed && budget.value01 < 0.6;
  const discLow = discipline.committed && discipline.value01 < 0.6;
  const strict = strategicPressure === "pressure" || (budgetLow && discLow);

  const modifiers: QuarterEngineModifiers = {
    xpMultiplier: strict ? 0.9 : 1,
    maxSkipsPerDay: strategicPressure === "relaxed" ? 99 : strategicPressure === "normal" ? 2 : 1,
    extraMissionFloorDelta: strict ? 1 : 0,
    budgetNoSpendRecommended: strict,
  };

  return {
    strategyScorePct,
    strategicPressure,
    legacyZone,
    pressureMeter,
    growth,
    budget,
    xp,
    discipline,
    modifiers,
  };
}

export function quarterEngineRuleLinesNl(result: QuarterEngineResult): string[] {
  const lines: string[] = [];
  const { modifiers, strategicPressure } = result;
  if (modifiers.xpMultiplier < 1) {
    lines.push("XP-multiplier actief: −10% op nieuwe XP (herstel score om dit te verlichten).");
  }
  if (modifiers.maxSkipsPerDay <= 1) {
    lines.push(`Max. ${modifiers.maxSkipsPerDay} skip per dag op terugkerende missies.`);
  }
  if (modifiers.extraMissionFloorDelta > 0) {
    lines.push("Engine verhoogt het minimum aantal aanbevolen missies met +1.");
  }
  if (modifiers.budgetNoSpendRecommended) {
    lines.push("No-spend modus aanbevolen: plan morgen bewust geen impulse-uitgaven.");
  }
  if (lines.length === 0) {
    lines.push(
      strategicPressure === "relaxed"
        ? "Je zit op koers — meer ruimte voor keuzes."
        : "Geen extra beperkingen vandaag; blijf de vier pijlers voeden."
    );
  }
  return lines;
}
