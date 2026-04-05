/**
 * Strategy engine parameters — single write path: `strategy_focus.engine_params`.
 * - Read with `normalizeStrategyEngineParams` everywhere (never trust raw JSON).
 * - Does not duplicate `user_preferences` push toggles or `users.monthly_budget_cents`; those stay separate.
 * - Spaardoel: expliciet `savings.quarterlyMustSaveCents` wint; anders Budget (`monthly_savings_cents` × 3) en/of
 *   actieve spaardoelen met deadline (wekelijks tempo × 13). Zie `resolveEffectiveQuarterlySavingsTargetCents`.
 * - UI: kwartaalcontract (spaar-/leer-/XP) op Strategy → Contract; engine-tuning (missies, locks, push, executie) op
 *   Profiel → Engine → Strategy. Budget/Growth tonen pace hints read-only via `getStrategyPacingHints`.
 */
import { bandFor10Scale, type StatBand } from "@/lib/behavioral-engine";
import {
  normalizeExecutionBehaviorFocus,
  type ExecutionBehaviorFocus,
} from "@/lib/strategy/execution-behavior";
import { weeklyRequired } from "@/lib/utils/savings";

export type { ExecutionBehaviorFocus } from "@/lib/strategy/execution-behavior";

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
  /** Welk gedrag je op Missions wilt laten meetellen voor de executie-pijler. */
  execution: {
    behaviorFocus: ExecutionBehaviorFocus;
  };
};

/** ~13 weken per kalenderkwartaal — impliciet doel uit spaardoelen (weekly pace). */
const WEEKS_PER_QUARTER = 13;

/** Actieve spaardoelen + maand-spaarreserve uit Budget (users.monthly_savings_cents). */
export type StrategyBudgetSavingsContext = {
  budgetMonthlySavingsCents: number | null;
  savingsGoals: Array<{
    target_cents: number;
    current_cents: number;
    deadline: string | null;
    status?: string | null;
  }>;
};

function impliedQuarterlyFromGoals(goals: StrategyBudgetSavingsContext["savingsGoals"]): number | null {
  let sum = 0;
  let any = false;
  for (const g of goals) {
    if (g.status === "completed" || g.status === "cancelled") continue;
    const wk = weeklyRequired(g.target_cents, g.current_cents, g.deadline);
    if (wk != null && wk > 0) {
      sum += wk * WEEKS_PER_QUARTER;
      any = true;
    }
  }
  if (!any || sum <= 0) return null;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.round(sum));
}

/**
 * Kwartaal spaardoel voor Strategy-engine: eerst contractveld, dan Budget (×3 maandreserve), dan tempo uit doelen met deadline.
 */
export function resolveEffectiveQuarterlySavingsTargetCents(
  quarterlyMustSaveCents: number | null | undefined,
  ctx: StrategyBudgetSavingsContext
): number | null {
  const q =
    quarterlyMustSaveCents != null && Number.isFinite(quarterlyMustSaveCents) && quarterlyMustSaveCents > 0
      ? Math.floor(quarterlyMustSaveCents)
      : null;
  if (q != null) return q;

  const monthly = ctx.budgetMonthlySavingsCents ?? 0;
  if (monthly > 0) {
    return Math.round(monthly * 3);
  }

  return impliedQuarterlyFromGoals(ctx.savingsGoals);
}

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
  execution: {
    behaviorFocus: "balanced",
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
      execution: { ...d.execution },
    };
  const o = raw as Record<string, unknown>;

  const missionsIn = (o.missions && typeof o.missions === "object" ? o.missions : {}) as Record<string, unknown>;
  const budgetIn = (o.budget && typeof o.budget === "object" ? o.budget : {}) as Record<string, unknown>;
  const savingsIn = (o.savings && typeof o.savings === "object" ? o.savings : {}) as Record<string, unknown>;
  const growthIn = (o.growth && typeof o.growth === "object" ? o.growth : {}) as Record<string, unknown>;
  const xpIn = (o.xp && typeof o.xp === "object" ? o.xp : {}) as Record<string, unknown>;
  const notifIn = (o.notifications && typeof o.notifications === "object" ? o.notifications : {}) as Record<string, unknown>;
  const execIn = (o.execution && typeof o.execution === "object" ? o.execution : {}) as Record<string, unknown>;

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
    execution: {
      behaviorFocus: normalizeExecutionBehaviorFocus(execIn.behaviorFocus),
    },
  };
}

/**
 * Kwartaal contract counts as ingevuld when growth + XP commitments set and spaar-commitment aanwezig is
 * (contractbedrag óf afleidbaar uit Budget: spaarreserve en/of spaardoelen met deadline).
 */
export function isQuarterContractComplete(ep: unknown, budgetCtx?: StrategyBudgetSavingsContext): boolean {
  const n = normalizeStrategyEngineParams(ep);
  const growth = n.growth.quarterlyLearningProgressTargetPct;
  const xp = n.xp.quarterlyTargetXpEarned;
  const save =
    budgetCtx != null
      ? resolveEffectiveQuarterlySavingsTargetCents(n.savings.quarterlyMustSaveCents, budgetCtx)
      : n.savings.quarterlyMustSaveCents;
  return (
    typeof save === "number" &&
    save > 0 &&
    typeof growth === "number" &&
    growth > 0 &&
    typeof xp === "number" &&
    xp > 0
  );
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
    execution: Partial<StrategyEngineParams["execution"]>;
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
  if (patch.execution) {
    base.execution = { ...base.execution, ...patch.execution };
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
