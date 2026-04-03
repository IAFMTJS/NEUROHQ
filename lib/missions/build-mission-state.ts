/**
 * Pure mission / UMS assembly after all DB reads (single place for ranked list + decision blocks).
 */
import type { DecisionBlocksResult, TaskWithMeta, TaskWithUMS } from "@/app/actions/missions-performance";
import { computeUMS } from "@/lib/missions/ums-scoring";
import { dataMaturityMissionsHintNl, type UserDataMaturity } from "@/lib/user-data-maturity";

const DIVERSITY_PENALTY = 0.2;

export type BuildMissionStateContext = {
  tasks: TaskWithMeta[];
  strategy: { primary_domain: string; secondary_domains: string[] } | null;
  pressureZone: "comfort" | "healthy" | "risk";
  alignmentScore: number;
  streakAtRisk: boolean;
  userEnergy: number;
  consequenceState: {
    recoveryOnly?: boolean;
    recoveryProtocol?: boolean;
    daysSinceLastCompletion?: number;
  };
  dataMaturity: UserDataMaturity;
  completionRates: Record<string, number>;
  recentlyCompletedIds: Set<string>;
};

export function buildMissionState(ctx: BuildMissionStateContext): DecisionBlocksResult {
  const tasks = ctx.tasks;
  const strategyPrimary = ctx.strategy?.primary_domain ?? "discipline";
  const strategySecondary = ctx.strategy?.secondary_domains ?? [];

  const withUMS: TaskWithUMS[] = tasks.map((t) => {
    const breakdown = computeUMS(t, {
      strategyPrimary,
      strategySecondary,
      completionRate: ctx.completionRates[t.id] ?? 0.7,
      userEnergy: ctx.userEnergy,
      pressureZone: ctx.pressureZone,
    });
    let ums = breakdown.ums;
    if (ctx.recentlyCompletedIds.has(t.id)) {
      ums = Math.max(0.1, ums - DIVERSITY_PENALTY);
    }
    return {
      ...t,
      umsBreakdown: { ...breakdown, ums },
    };
  });

  withUMS.sort((a, b) => b.umsBreakdown.ums - a.umsBreakdown.ums);
  const topRecommendation = withUMS[0] ?? null;

  const streakCritical: TaskWithMeta[] = ctx.streakAtRisk ? tasks.slice(0, 2) : [];
  const highPressure: TaskWithMeta[] =
    ctx.pressureZone === "risk" || ctx.pressureZone === "healthy"
      ? tasks.filter((t) => ((t.urgency ?? 0) >= 2 || (t.impact ?? 0) >= 2)).slice(0, 4)
      : [];
  const recovery: TaskWithMeta[] = tasks.filter((t) => (t.energy_required ?? 5) <= 3).slice(0, 3);
  const strategyForAlignment = ctx.strategy;
  const alignmentFix: TaskWithMeta[] =
    ctx.alignmentScore < 0.7 && strategyForAlignment
      ? tasks.filter((t) => t.domain === strategyForAlignment.primary_domain).slice(0, 3)
      : [];

  return {
    streakCritical,
    highPressure,
    recovery,
    alignmentFix,
    topRecommendation,
    tasksSortedByUMS: withUMS,
    streakAtRisk: ctx.streakAtRisk,
    pressureZone: ctx.pressureZone,
    alignmentScore: ctx.alignmentScore,
    strategyMapping: ctx.strategy
      ? { primaryDomain: ctx.strategy.primary_domain, secondaryDomains: ctx.strategy.secondary_domains }
      : null,
    recoveryOnly: ctx.consequenceState.recoveryOnly,
    recoveryProtocol: ctx.consequenceState.recoveryProtocol,
    daysSinceLastCompletion: ctx.consequenceState.daysSinceLastCompletion,
    dataMaturity: ctx.dataMaturity,
    dataMaturityHintNl: dataMaturityMissionsHintNl(ctx.dataMaturity),
  };
}
