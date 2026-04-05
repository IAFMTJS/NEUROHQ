"use server";

import { createClient } from "@/lib/supabase/server";
import { getStrategyPacingHints } from "@/app/actions/strategy-engine-pacing";
import {
  calendarQuarterBounds,
  normalizeStrategyEngineParams,
  resolveEffectiveQuarterlySavingsTargetCents,
  type StrategyEngineParams,
} from "@/lib/strategy/engine-params";
import { getStrategyBudgetSavingsContext } from "@/app/actions/strategy-budget-savings-context";
import {
  computeQuarterEngine,
  quarterEngineRuleLinesNl,
  type QuarterEngineResult,
} from "@/lib/strategy/quarter-engine";
import { todayDateString } from "@/lib/utils/timezone";
import { getActiveProtocolQuarterMissionStats, type ProtocolQuarterMissionStats } from "@/app/actions/protocol-growth-stats";
import { loadExecutionQuarterMetrics } from "@/app/actions/execution-quarter-metrics";
import {
  computeExecutionDisciplinePillar,
  normalizeExecutionBehaviorFocus,
} from "@/lib/strategy/execution-behavior";
import type { QuarterCommandMetrics } from "@/lib/strategy/quarter-command-metrics";

export type QuarterEngineSnapshot = QuarterEngineResult & {
  quarterStart: string;
  quarterEnd: string;
  quarterLabel: string;
  ruleLinesNl: string[];
  engineParams: StrategyEngineParams;
  /** Thesis deadline UX */
  daysToDeadline: number;
  thesisDeadlinePassed: boolean;
  pressureBoostAfterDeadline: boolean;
  /** Growth op basis van protocoltaken dit kalenderkwartaal (verwacht over meerdere protocolweken vs afgerond). */
  growthProtocolQuarter: ProtocolQuarterMissionStats | null;
  /** Ruwe cijfers voor Command-tab kaarten. */
  commandMetrics: QuarterCommandMetrics;
};

function quarterLabel(start: string): string {
  const [y, m] = start.split("-").map(Number);
  const q = Math.floor((m - 1) / 3) + 1;
  return `Q${q} ${y}`;
}

async function sumXpEventsInRange(userId: string, start: string, end: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xp_events")
    .select("amount")
    .eq("user_id", userId)
    .gte("created_at", `${start}T00:00:00.000Z`)
    .lte("created_at", `${end}T23:59:59.999Z`);
  if (error || !data) return 0;
  return (data as { amount: number }[]).reduce((s, r) => s + (r.amount ?? 0), 0);
}

async function countTaskCompletesInQuarter(userId: string, start: string, end: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("task_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "complete")
    .gte("occurred_at", `${start}T00:00:00.000Z`)
    .lte("occurred_at", `${end}T23:59:59.999Z`);
  if (error) return 0;
  return count ?? 0;
}

async function countMissionOutcomesInQuarter(
  userId: string,
  start: string,
  end: string
): Promise<{ skip: number; reschedule: number; delete: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mission_outcome_events")
    .select("outcome")
    .eq("user_id", userId)
    .gte("occurred_at", `${start}T00:00:00.000Z`)
    .lte("occurred_at", `${end}T23:59:59.999Z`);
  if (error || !data) return { skip: 0, reschedule: 0, delete: 0 };
  let skip = 0;
  let reschedule = 0;
  let delete_ = 0;
  for (const row of data as { outcome: string }[]) {
    if (row.outcome === "skip") skip++;
    else if (row.outcome === "reschedule") reschedule++;
    else if (row.outcome === "delete") delete_++;
  }
  return { skip, reschedule, delete: delete_ };
}

/** Active strategy quarter engine snapshot; null if no user or no active strategy. */
export async function getQuarterEngineSnapshot(): Promise<QuarterEngineSnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: row }, budgetCtx] = await Promise.all([
    supabase
      .from("strategy_focus")
      .select("id, deadline, engine_params, pressure_boost_after_deadline")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getStrategyBudgetSavingsContext(),
  ]);

  if (!row) return null;

  const engineParams = normalizeStrategyEngineParams((row as { engine_params?: unknown }).engine_params);
  const effectiveSavingsTargetCents = resolveEffectiveQuarterlySavingsTargetCents(
    engineParams.savings.quarterlyMustSaveCents,
    budgetCtx
  );
  const today = todayDateString();
  const { start, end } = calendarQuarterBounds(today);
  const [pacing, protocolQuarterStats] = await Promise.all([
    getStrategyPacingHints(),
    getActiveProtocolQuarterMissionStats(),
  ]);

  const xpEarned = await sumXpEventsInRange(user.id, start, end);
  const completes = await countTaskCompletesInQuarter(user.id, start, end);
  const neg = await countMissionOutcomesInQuarter(user.id, start, end);
  const disciplineNegative = neg.skip + neg.reschedule + neg.delete;

  const behaviorFocus = normalizeExecutionBehaviorFocus(engineParams.execution?.behaviorFocus);
  const execMetrics = {
    ...(await loadExecutionQuarterMetrics(user.id, start, end, today)),
    skipRescheduleDelete: disciplineNegative,
  };

  const disciplineOverride =
    behaviorFocus === "balanced"
      ? null
      : computeExecutionDisciplinePillar(behaviorFocus, execMetrics, completes, disciplineNegative);

  let growthTargetPct = engineParams.growth.quarterlyLearningProgressTargetPct;
  let growthActualPct = pacing?.learningRoughPct ?? null;
  let growthProtocolQuarter: ProtocolQuarterMissionStats | null = null;

  if (protocolQuarterStats && protocolQuarterStats.expectedTasks > 0) {
    growthProtocolQuarter = protocolQuarterStats;
    growthTargetPct = 100;
    growthActualPct = Math.min(
      100,
      Math.round((100 * protocolQuarterStats.completedTasks) / protocolQuarterStats.expectedTasks)
    );
  }

  const inputs = {
    growthTargetPct,
    growthActualPct,
    savingsTargetCents: effectiveSavingsTargetCents,
    savedThisQuarterCents: pacing?.savedThisQuarterCents ?? null,
    xpTargetEarned: engineParams.xp.quarterlyTargetXpEarned,
    xpEarnedThisQuarter: xpEarned,
    disciplineCompleted: completes,
    disciplineNegative,
    disciplineOverride,
  };

  const commandMetrics: QuarterCommandMetrics = {
    savedThisQuarterCents: inputs.savedThisQuarterCents,
    savingsTargetCents: inputs.savingsTargetCents,
    xpEarnedThisQuarter: inputs.xpEarnedThisQuarter,
    xpTargetEarned: inputs.xpTargetEarned,
    growthContractTargetPct: engineParams.growth.quarterlyLearningProgressTargetPct,
    growthActualPct: inputs.growthActualPct,
    growthEngineTargetPct: inputs.growthTargetPct,
    taskCompletesInQuarter: completes,
    missionOutcomeNegative: disciplineNegative,
    missionOutcomesBreakdown: neg,
  };

  let result = computeQuarterEngine(inputs);

  const deadlineStr = (row as { deadline: string }).deadline;
  const deadline = new Date(deadlineStr + "T23:59:59");
  const now = new Date();
  const daysToDeadline = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 86400000));
  const thesisDeadlinePassed = daysToDeadline <= 0;
  const boost = (row as { pressure_boost_after_deadline?: boolean }).pressure_boost_after_deadline === true;

  if (thesisDeadlinePassed || boost) {
    result = {
      ...result,
      strategicPressure: "pressure",
      legacyZone: "risk",
      pressureMeter: Math.max(result.pressureMeter, 1.5),
      modifiers: {
        ...result.modifiers,
        maxSkipsPerDay: Math.min(result.modifiers.maxSkipsPerDay, 1),
        xpMultiplier: Math.min(result.modifiers.xpMultiplier, 0.9),
        extraMissionFloorDelta: Math.max(result.modifiers.extraMissionFloorDelta, 1),
        budgetNoSpendRecommended: true,
      },
    };
  }

  return {
    ...result,
    quarterStart: start,
    quarterEnd: end,
    quarterLabel: quarterLabel(start),
    ruleLinesNl: quarterEngineRuleLinesNl(result),
    engineParams,
    daysToDeadline,
    thesisDeadlinePassed,
    pressureBoostAfterDeadline: boost,
    growthProtocolQuarter,
    commandMetrics,
  };
}

/** Legacy `getPressureIndex` shape for missions + thesis meter. */
export async function getQuarterPressureLegacy(strategyId: string): Promise<{
  pressure: number;
  zone: "comfort" | "healthy" | "risk";
  daysRemaining: number;
  targetRemaining: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { pressure: 0, zone: "comfort", daysRemaining: 0, targetRemaining: 0 };
  }

  const { data: row } = await supabase
    .from("strategy_focus")
    .select("id, deadline, pressure_boost_after_deadline")
    .eq("id", strategyId)
    .eq("user_id", user.id)
    .single();

  if (!row) {
    return { pressure: 0, zone: "comfort", daysRemaining: 0, targetRemaining: 0 };
  }

  const snap = await getQuarterEngineSnapshot();
  if (!snap) {
    const deadline = new Date((row as { deadline: string }).deadline + "T23:59:59");
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 86400000));
    return { pressure: 0, zone: "comfort", daysRemaining, targetRemaining: 0 };
  }

  const deadline = new Date((row as { deadline: string }).deadline + "T23:59:59");
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 86400000));

  return {
    pressure: snap.pressureMeter,
    zone: snap.legacyZone,
    daysRemaining,
    targetRemaining: snap.strategyScorePct,
  };
}

export async function getQuarterXpMultiplierForUser(): Promise<number> {
  const snap = await getQuarterEngineSnapshot();
  if (!snap) return 1;
  return snap.modifiers.xpMultiplier;
}

export async function getMissionSkipCapForUser(): Promise<number | null> {
  const snap = await getQuarterEngineSnapshot();
  if (!snap) return null;
  const cap = snap.modifiers.maxSkipsPerDay;
  if (cap >= 90) return null;
  return cap;
}
