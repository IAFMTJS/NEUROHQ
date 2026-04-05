/**
 * Strategy engine parameters — single write path: `strategy_focus.engine_params` (Profiel → Engine → Strategy engine).
 * - Read with `normalizeStrategyEngineParams` everywhere (never trust raw JSON).
 * - Does not duplicate `user_preferences` push toggles or `users.monthly_budget_cents`; those stay separate.
 * - Quarterly savings/learning targets here are strategic commitments; Budget/Growth UIs may show pace hints
 *   via `getStrategyPacingHints` without writing back (read-only, no dual data stream).
 */
import { bandFor10Scale, type StatBand } from "@/lib/behavioral-engine";

export const ENGINE_PARAMS_VERSION = 1 as const;

/** Per-area push style: reminder-heavy, positive reinforcement, or mix. */
export type PushAreaStyle = "reminder" | "positive" | "balanced";

export type MissionEngineTuning = {
  /** Minimum suggested missions when energy band is low (1–8). */
  minOnLowEnergyDay: number;
  /** Override for medium energy; null = derived from min + 2 (capped 8). */
  targetOnMediumDay: number | null;
  /** Override for good/ultra energy; null = derived from min + 4 (capped 8). */
  targetOnGoodDay: number | null;
};

export type StrategyEngineParams = {
  version: typeof ENGINE_PARAMS_VERSION;
  missions: MissionEngineTuning;
  budget: {
    /** Max no-spend lock events per calendar quarter (budget_control_locks rows). */
    maxLocksPerQuarter: number;
  };
  savings: {
    /** Amount user commits to save this calendar quarter (cents). */
    quarterlyMustSaveCents: number | null;
  };
  growth: {
    /** Target % of active protocol / learning track to complete this quarter (0–100). */
    quarterlyLearningProgressTargetPct: number | null;
  };
  /** Quarter XP contract: gross XP to earn this calendar quarter (from xp_events). */
  xp: {
    quarterlyTargetXpEarned: number | null;
  };
  notifications: {
    missions: PushAreaStyle;
    budget: PushAreaStyle;
    growth: PushAreaStyle;
    strategy: PushAreaStyle;
  };
};

export const DEFAULT_STRATEGY_ENGINE_PARAMS: StrategyEngineParams = {
  version: ENGINE_PARAMS_VERSION,
  missions: {
    minOnLowEnergyDay: 1,
    targetOnMediumDay: null,
    targetOnGoodDay: null,
  },
  budget: {
    maxLocksPerQuarter: 12,
  },
  savings: {
    quarterlyMustSaveCents: null,
  },
  growth: {
    quarterlyLearningProgressTargetPct: null,
  },
  xp: {
    quarterlyTargetXpEarned: null,
  },
  notifications: {
    missions: "balanced",
    budget: "balanced",
    growth: "balanced",
    strategy: "balanced",
  },
};

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}

/** Merge stored JSON with defaults (invalid keys ignored). */
export function normalizeStrategyEngineParams(raw: unknown): StrategyEngineParams {
  const d = DEFAULT_STRATEGY_ENGINE_PARAMS;
  if (!raw || typeof raw !== "object")
    return {
      ...d,
      missions: { ...d.missions },
      xp: { ...d.xp },
      notifications: { ...d.notifications },
    };
  const o = raw as Record<string, unknown>;

  const missionsIn = (o.missions && typeof o.missions === "object" ? o.missions : {}) as Record<string, unknown>;
  const budgetIn = (o.budget && typeof o.budget === "object" ? o.budget : {}) as Record<string, unknown>;
  const savingsIn = (o.savings && typeof o.savings === "object" ? o.savings : {}) as Record<string, unknown>;
  const growthIn = (o.growth && typeof o.growth === "object" ? o.growth : {}) as Record<string, unknown>;
  const xpIn = (o.xp && typeof o.xp === "object" ? o.xp : {}) as Record<string, unknown>;
  const notifIn = (o.notifications && typeof o.notifications === "object" ? o.notifications : {}) as Record<string, unknown>;

  const push = (k: keyof StrategyEngineParams["notifications"]): PushAreaStyle => {
    const v = notifIn[k as string];
    if (v === "reminder" || v === "positive" || v === "balanced") return v;
    return d.notifications[k];
  };

  return {
    version: ENGINE_PARAMS_VERSION,
    missions: {
      minOnLowEnergyDay: clampInt(Number(missionsIn.minOnLowEnergyDay ?? d.missions.minOnLowEnergyDay), 1, 8),
      targetOnMediumDay:
        missionsIn.targetOnMediumDay == null || missionsIn.targetOnMediumDay === ""
          ? null
          : clampInt(Number(missionsIn.targetOnMediumDay), 1, 8),
      targetOnGoodDay:
        missionsIn.targetOnGoodDay == null || missionsIn.targetOnGoodDay === ""
          ? null
          : clampInt(Number(missionsIn.targetOnGoodDay), 1, 8),
    },
    budget: {
      maxLocksPerQuarter: clampInt(Number(budgetIn.maxLocksPerQuarter ?? d.budget.maxLocksPerQuarter), 0, 100),
    },
    savings: {
      quarterlyMustSaveCents:
        savingsIn.quarterlyMustSaveCents == null || savingsIn.quarterlyMustSaveCents === ""
          ? null
          : Math.max(0, Math.floor(Number(savingsIn.quarterlyMustSaveCents))),
    },
    growth: {
      quarterlyLearningProgressTargetPct:
        growthIn.quarterlyLearningProgressTargetPct == null || growthIn.quarterlyLearningProgressTargetPct === ""
          ? null
          : clampInt(Number(growthIn.quarterlyLearningProgressTargetPct), 0, 100),
    },
    xp: {
      quarterlyTargetXpEarned:
        xpIn.quarterlyTargetXpEarned == null || xpIn.quarterlyTargetXpEarned === ""
          ? null
          : Math.max(0, Math.floor(Number(xpIn.quarterlyTargetXpEarned))),
    },
    notifications: {
      missions: push("missions"),
      budget: push("budget"),
      growth: push("growth"),
      strategy: push("strategy"),
    },
  };
}

/** Floors from mission tuning for a given energy reading (1–10). */
export function missionFloorForEnergy(energy: number, m: MissionEngineTuning): number {
  const band = bandFor10Scale(energy);
  const minL = clampInt(m.minOnLowEnergyDay, 1, 8);
  const med =
    m.targetOnMediumDay != null ? clampInt(m.targetOnMediumDay, 1, 8) : Math.min(8, minL + 2);
  const good =
    m.targetOnGoodDay != null ? clampInt(m.targetOnGoodDay, 1, 8) : Math.min(8, minL + 4);
  if (band === "low") return minL;
  if (band === "medium") return med;
  if (band === "good") return good;
  return Math.min(8, Math.max(good, minL));
}

/** UI helper: show derived targets when user only set minimum. */
export function derivedMissionTargets(m: MissionEngineTuning): {
  low: number;
  medium: number;
  good: number;
} {
  const minL = clampInt(m.minOnLowEnergyDay, 1, 8);
  const med = m.targetOnMediumDay != null ? clampInt(m.targetOnMediumDay, 1, 8) : Math.min(8, minL + 2);
  const good = m.targetOnGoodDay != null ? clampInt(m.targetOnGoodDay, 1, 8) : Math.min(8, minL + 4);
  return { low: minL, medium: med, good };
}

export function mergeStrategyEngineParams(
  current: unknown,
  patch: Partial<{
    missions: Partial<MissionEngineTuning>;
    budget: Partial<StrategyEngineParams["budget"]>;
    savings: Partial<StrategyEngineParams["savings"]>;
    growth: Partial<StrategyEngineParams["growth"]>;
    xp: Partial<StrategyEngineParams["xp"]>;
    notifications: Partial<StrategyEngineParams["notifications"]>;
  }>
): StrategyEngineParams {
  const base = normalizeStrategyEngineParams(current);
  if (patch.missions) {
    base.missions = { ...base.missions, ...patch.missions };
  }
  if (patch.budget) {
    base.budget = { ...base.budget, ...patch.budget };
  }
  if (patch.savings) {
    base.savings = { ...base.savings, ...patch.savings };
  }
  if (patch.growth) {
    base.growth = { ...base.growth, ...patch.growth };
  }
  if (patch.xp) {
    base.xp = { ...base.xp, ...patch.xp };
  }
  if (patch.notifications) {
    base.notifications = { ...base.notifications, ...patch.notifications };
  }
  return normalizeStrategyEngineParams(base);
}

export function calendarQuarterBounds(dateStr: string): { start: string; end: string } {
  const [y, mo] = dateStr.split("-").map(Number);
  const q = Math.floor((mo - 1) / 3);
  const startM = q * 3 + 1;
  const endM = startM + 2;
  const lastDay = new Date(Date.UTC(y, endM, 0)).getUTCDate();
  return {
    start: `${y}-${String(startM).padStart(2, "0")}-01`,
    end: `${y}-${String(endM).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Map push area style to weight for picking reminder vs reinforcement templates (cron). */
export function pushStyleWeights(style: PushAreaStyle): { reminder: number; positive: number } {
  switch (style) {
    case "reminder":
      return { reminder: 0.75, positive: 0.25 };
    case "positive":
      return { reminder: 0.25, positive: 0.75 };
    default:
      return { reminder: 0.5, positive: 0.5 };
  }
}

export type EnergyBand = StatBand;
