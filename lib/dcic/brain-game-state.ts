import type { GameState } from "./types";
import {
  deriveDcicSuggestedMode,
  getBehavioralConstraints,
  getBrainState,
  getEffectiveBehavioralStats,
  normalizeBehavioralStats,
} from "@/lib/behavioral-engine";

/** Rij uit daily_state met alle velden voor de gedragsengine. */
export type DailyRowForBrain = {
  energy?: number | null;
  focus?: number | null;
  sensory_load?: number | null;
  load?: number | null;
  mental_battery?: number | null;
  physical_health?: number | null;
  sleep_hours?: number | null;
};

/**
 * Zet `mode.suggested` (war/recovery) en `authority.lastSuggestedMode` op basis van brain status.
 * Verandert geen `mode.current` — dat doet `autoModeCheck` / client override.
 */
export function applyBrainLayerToGameState(gameState: GameState, daily: DailyRowForBrain | null): void {
  if (!daily || daily.energy == null || daily.focus == null) return;

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
  const suggested = deriveDcicSuggestedMode({ normalized, effective, brainState, constraints });

  gameState.mode.suggested = suggested;
  gameState.authority.lastSuggestedMode = suggested;
}
