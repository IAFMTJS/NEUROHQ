/**
 * Identity Drift Model: data-driven identity from 30–90d behaviour.
 * Types: structured_operator, volatile_sprinter, avoidant_strategist, social_executor, burnout_cycler.
 * Each type has mechanical modifiers (XP, load buildup, risk/reward).
 */

export type IdentityDriftType =
  | "structured_operator"
  | "volatile_sprinter"
  | "avoidant_strategist"
  | "social_executor"
  | "burnout_cycler";

export interface IdentityScore {
  disciplineIndex: number;
  volatilityIndex: number;
  avoidanceIndex: number;
  recoveryDependencyIndex: number;
  socialIntensityIndex: number;
}

export interface IdentityDriftModifiers {
  /** XP multiplier (e.g. 1.0 = neutral). */
  xpMultiplier: number;
  /** Load buildup rate factor (>1 = faster load). */
  loadBuildRate: number;
  /** High-risk reward ratio (0–1; lower = less bonus for risky). */
  highRiskRewardRatio: number;
  /** Peak XP bonus for volatile (extra on S-rank). */
  peakXpBonus: number;
}

const DEFAULT_MODIFIERS: IdentityDriftModifiers = {
  xpMultiplier: 1,
  loadBuildRate: 1,
  highRiskRewardRatio: 1,
  peakXpBonus: 0,
};

/** Modifiers per type (subtle; not punitive). */
const TYPE_MODIFIERS: Record<IdentityDriftType, IdentityDriftModifiers> = {
  structured_operator: {
    xpMultiplier: 1.05,
    loadBuildRate: 0.9,
    highRiskRewardRatio: 0.85,
    peakXpBonus: 0,
  },
  volatile_sprinter: {
    xpMultiplier: 1,
    loadBuildRate: 1.2,
    highRiskRewardRatio: 1.15,
    peakXpBonus: 0.1,
  },
  avoidant_strategist: {
    xpMultiplier: 0.98,
    loadBuildRate: 1.05,
    highRiskRewardRatio: 0.9,
    peakXpBonus: 0,
  },
  social_executor: {
    xpMultiplier: 1.03,
    loadBuildRate: 0.95,
    highRiskRewardRatio: 1,
    peakXpBonus: 0,
  },
  burnout_cycler: {
    xpMultiplier: 0.95,
    loadBuildRate: 1.15,
    highRiskRewardRatio: 0.8,
    peakXpBonus: 0,
  },
};

export function getModifiersForType(type: IdentityDriftType): IdentityDriftModifiers {
  return TYPE_MODIFIERS[type] ?? DEFAULT_MODIFIERS;
}

/** Map indices to derived type (no permanent stamp; can shift). */
export function deriveIdentityType(score: IdentityScore): IdentityDriftType {
  const { disciplineIndex, volatilityIndex, avoidanceIndex, recoveryDependencyIndex, socialIntensityIndex } = score;
  if (recoveryDependencyIndex >= 70 && volatilityIndex >= 60) return "burnout_cycler";
  if (avoidanceIndex >= 65) return "avoidant_strategist";
  if (volatilityIndex >= 65 && disciplineIndex >= 50) return "volatile_sprinter";
  if (socialIntensityIndex >= 60 && disciplineIndex >= 55) return "social_executor";
  if (disciplineIndex >= 60 && volatilityIndex < 50) return "structured_operator";
  return "structured_operator";
}

/** Compute identity indices from raw stats (0–100). */
export function computeIdentityIndices(stats: {
  completionRate: number;
  avgRankScore: number;
  cancelRatio: number;
  socialRatio: number;
  recoveryRatio: number;
  rankVariance: number;
  activeDaysRatio: number;
}): IdentityScore {
  const disciplineIndex = Math.round(
    Math.min(100, stats.completionRate * 40 + stats.activeDaysRatio * 30 + (1 - stats.cancelRatio) * 30)
  );
  const volatilityIndex = Math.round(Math.min(100, stats.rankVariance * 100));
  const avoidanceIndex = Math.round(Math.min(100, stats.cancelRatio * 100));
  const recoveryDependencyIndex = Math.round(Math.min(100, stats.recoveryRatio * 100));
  const socialIntensityIndex = Math.round(Math.min(100, stats.socialRatio * 100));
  return {
    disciplineIndex: Math.max(0, Math.min(100, disciplineIndex)),
    volatilityIndex: Math.max(0, Math.min(100, volatilityIndex)),
    avoidanceIndex: Math.max(0, Math.min(100, avoidanceIndex)),
    recoveryDependencyIndex: Math.max(0, Math.min(100, recoveryDependencyIndex)),
    socialIntensityIndex: Math.max(0, Math.min(100, socialIntensityIndex)),
  };
}

export const IDENTITY_DRIFT_LABELS: Record<IdentityDriftType, string> = {
  structured_operator: "Structured Operator",
  volatile_sprinter: "Volatile Sprinter",
  avoidant_strategist: "Avoidant Strategist",
  social_executor: "Social Executor",
  burnout_cycler: "Burnout Cycler",
};
