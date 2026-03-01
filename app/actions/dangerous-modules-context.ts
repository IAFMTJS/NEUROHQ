"use server";

import { getIdentityDrift, type IdentityDriftState } from "@/app/actions/identity-drift";
import { getLoadForecast } from "@/app/actions/cognitive-load-forecast";
import { getWeeklyTacticalMode, type WeeklyTacticalState } from "@/app/actions/weekly-tactical-mode-action";
import { getChaosScarcityEligibility } from "@/app/actions/chaos-scarcity";
import { getAutopilotState } from "@/app/actions/autopilot";
import { canInvestFocusToday } from "@/app/actions/cognitive-investment";
import { getRegretForType } from "@/app/actions/regret-mechanic";
import type { CognitiveLoadForecast } from "@/lib/cognitive-load-forecast";
import type { ChaosScarcityEligibility } from "@/app/actions/chaos-scarcity";

/** Single context for all dangerous modules: used by today-engine, suggestions, consequence. */
export interface DangerousModulesContext {
  identityDrift: IdentityDriftState | null;
  loadForecast: CognitiveLoadForecast | null;
  weeklyMode: WeeklyTacticalState | null;
  chaosScarcity: ChaosScarcityEligibility | null;
  autopilot: Awaited<ReturnType<typeof getAutopilotState>>;
  canInvestFocus: boolean;
  /** Difficulty modifier from forecast + weekly mode (additive). */
  difficultyModifier: number;
  /** XP multiplier from identity + weekly mode (multiplicative). */
  xpMultiplier: number;
  /** Social missions capped when overload or recovery week. */
  socialCap: boolean;
  /** Recovery week suggested message. */
  recoveryWeekMessage: string | null;
  /** Regret: suggest missed type (e.g. "push"). */
  suggestMissedType: string | null;
  /** Regret XP modifier (0–1). */
  regretXpModifier: number;
}

export async function getDangerousModulesContext(dateStr: string): Promise<DangerousModulesContext> {
  const [
    identityDrift,
    loadForecast,
    weeklyMode,
    chaosScarcity,
    autopilot,
    canInvestFocus,
    regretPush,
  ] = await Promise.all([
    getIdentityDrift(),
    getLoadForecast(dateStr),
    getWeeklyTacticalMode(dateStr),
    getChaosScarcityEligibility(dateStr),
    getAutopilotState(dateStr),
    canInvestFocusToday(dateStr),
    getRegretForType("push"),
  ]);

  const difficultyModifier = (loadForecast?.difficultyModifier ?? 0) + (weeklyMode?.modifiers ? 0 : 0);
  const xpMultIdentity = identityDrift?.modifiers.xpMultiplier ?? 1;
  const xpMultWeekly = weeklyMode?.modifiers.xpMultiplier ?? 1;
  const xpMultiplier = xpMultIdentity * xpMultWeekly;
  const socialCap = loadForecast?.socialCap ?? false;
  const recoveryWeekMessage = loadForecast?.message ?? null;
  const suggestMissedType =
    regretPush?.suggestMissedType === true && regretPush.missionType ? regretPush.missionType : null;
  const regretXpModifier = regretPush?.xpModifier ?? 1;

  return {
    identityDrift,
    loadForecast,
    weeklyMode,
    chaosScarcity,
    autopilot,
    canInvestFocus,
    difficultyModifier,
    xpMultiplier,
    socialCap,
    recoveryWeekMessage,
    suggestMissedType,
    regretXpModifier,
  };
}
