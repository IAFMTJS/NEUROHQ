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
    gameState.authority.lastSuggestedMode = null;
    return;
  }

  const avgPct = computeBrainStatusAveragePercent(daily);
  gameState.mode.brainStatusAveragePercent = avgPct;
  gameState.mode.warTierDaysLast7 = warTierDaysLast7;

  const mentalLoad = daily.load ?? daily.sensory_load ?? 5;
  const normalized = normalizeBehavioralStats({
    energy: daily.energy,
    focus: daily.focus,
    mentalBattery: daily.mental_battery ?? 5,
    mentalLoad: mentalLoad ?? 5,
    physicalHealth: daily.physical_health ?? 5,
    sleepHours: daily.sleep_hours ?? null,
  });
  const effective = getEffectiveBehavioralStats(normalized);
  const brainState = getBrainState(effective);
  const constraints = getBehavioralConstraints(normalized);
  const legacy = deriveDcicSuggestedMode({ normalized, effective, brainState, constraints });

  let suggested: DcicModeSuggestion = null;

  if (avgPct != null) {
    if (avgPct > 75) {
      suggested = "war";
    } else if (avgPct < 25) {
      suggested = "recovery";
    }
  }

  if (suggested == null) {
    if (legacy === "recovery") {
      const blockLegacyRecovery =
        avgPct != null && avgPct > 60 && warTierDaysLast7 < 3;
      if (!blockLegacyRecovery) {
        suggested = "recovery";
      }
    } else if (legacy === "war") {
      if (avgPct == null || avgPct > 75) {
        suggested = "war";
      }
    }
  }

  gameState.mode.suggested = suggested;
  gameState.authority.lastSuggestedMode = suggested;
}
