import type { GameState } from "./types";
import {
  computeBrainStatusAveragePercent,
  type DailyRowForBrain,
} from "@/lib/dcic/brain-status-average";
import {
  deriveDcicSuggestedMode,
  getBehavioralConstraints,
  getBrainState,
  getEffectiveBehavioralStats,
  normalizeBehavioralStats,
  resolveMentalLoad1To10,
} from "@/lib/behavioral-engine";
import type { DcicModeSuggestion } from "@/lib/behavioral-engine";

export type { DailyRowForBrain };

type ApplyBrainOptions = {
  /** Count of last-7d days with brain composite > 75% (war-tier streak). */
  warTierDaysLast7: number;
};

/**
 * Zet `mode.suggested` (war/recovery) en `authority.lastSuggestedMode` op basis van brain status.
 * Drempels: recovery bij gemiddelde <25%, war bij >75%; legacy-signalen worden gemixt.
 * Recovery uit legacy wordt geblokkeerd bij gemiddelde >60% tenzij ≥3 war-tier dagen (burnout na war).
 */
export function applyBrainLayerToGameState(
  gameState: GameState,
  daily: DailyRowForBrain | null,
  options: ApplyBrainOptions
): void {
  const { warTierDaysLast7 } = options;

  if (!daily || daily.energy == null || daily.focus == null) {
    gameState.mode.brainStatusAveragePercent = null;
    gameState.mode.warTierDaysLast7 = warTierDaysLast7;
    gameState.mode.suggested = null;
    gameState.mode.modeReason = null;
    gameState.authority.lastSuggestedMode = null;
    return;
  }

  const avgPct = computeBrainStatusAveragePercent(daily);
  gameState.mode.brainStatusAveragePercent = avgPct;
  gameState.mode.warTierDaysLast7 = warTierDaysLast7;

  const mentalLoad = resolveMentalLoad1To10({
    systemLoad: daily.load ?? null,
    sensoryLoad: daily.sensory_load ?? null,
    fallback: 5,
  });
  const normalized = normalizeBehavioralStats({
    energy: daily.energy,
    focus: daily.focus,
    mentalBattery: daily.mental_battery ?? 5,
    mentalLoad,
    physicalHealth: daily.physical_health ?? 5,
    sleepHours: daily.sleep_hours ?? null,
  });
  const effective = getEffectiveBehavioralStats(normalized);
  const brainState = getBrainState(effective);
  const constraints = getBehavioralConstraints(normalized);
  const legacy = deriveDcicSuggestedMode({ normalized, effective, brainState, constraints });

  let suggested: DcicModeSuggestion = null;
  let modeReason: string | null = null;

  if (avgPct != null) {
    if (avgPct > 75) {
      suggested = "war";
      modeReason = "brain_average_above_75";
    } else if (avgPct < 25) {
      suggested = "recovery";
      modeReason = "brain_average_below_25";
    }
  }

  if (suggested == null) {
    if (legacy === "recovery") {
      const blockLegacyRecovery =
        avgPct != null && avgPct > 60 && warTierDaysLast7 < 3;
      if (!blockLegacyRecovery) {
        suggested = "recovery";
        modeReason = "legacy_recovery_signal";
      }
    } else if (legacy === "war") {
      if (avgPct == null || avgPct > 75) {
        suggested = "war";
        modeReason = "legacy_war_signal";
      }
    }
  }

  gameState.mode.suggested = suggested;
  gameState.mode.modeReason = suggested ? modeReason : null;
  gameState.authority.lastSuggestedMode = suggested;
}
