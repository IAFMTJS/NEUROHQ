/**
 * NEUROHQ Assistant – state updater (state + signals + crisis → updatedState).
 * Deterministic; no AI. See Master Plan sectie 4.4.
 */

import type { EngineState } from "./types";
import type { Signals } from "./types";
import type { CrisisAssessment } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function updateStateFromSignals(
  state: EngineState,
  signals: Signals,
  crisisAssessment: CrisisAssessment
): EngineState {
  const newState = { ...state };

  if (signals.externalBlame)
    newState.stabilityIndex = clamp(newState.stabilityIndex - 2, 0, 100);

  if (signals.avoidanceAdmitted)
    newState.avoidanceTrend = clamp(newState.avoidanceTrend + 0.1, 0, 1);

  if (signals.taskCompleted) {
    newState.progress = (newState.progress ?? 0) + 5;
    newState.avoidanceTrend = Math.max(
      0,
      clamp(newState.avoidanceTrend - 0.1, 0, 1)
    );
  }

  if (signals.identityDoubt)
    newState.identityAlignmentScore = clamp(
      newState.identityAlignmentScore - 5,
      0,
      100
    );

  if (crisisAssessment.active) {
    newState.intensityTier = 1;
    newState.crisis = true;
  }

  newState.stabilityIndex = clamp(newState.stabilityIndex, 0, 100);
  newState.avoidanceTrend = clamp(newState.avoidanceTrend, 0, 1);
  newState.identityAlignmentScore = clamp(
    newState.identityAlignmentScore,
    0,
    100
  );

  return newState;
}
