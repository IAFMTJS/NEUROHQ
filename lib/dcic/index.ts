/**
 * Dark Commander Intelligence Core - Public API
 * Export all public functions and types
 */

// Types
export type {
  GameState,
  Mission,
  AssistantState,
  Intent,
  ActionObject,
  SimulationResult,
  BehaviourLogEntry,
  ValidationResult,
  ConfidenceLevel,
  IntentScore,
} from "./types";

// Core functions
export { validateAction } from "./state-gatekeeper";
export { buildAction, buildConfirmationAction } from "./action-builder";
export {
  simulateCompleteMission,
  simulateStartMission,
} from "./simulation";
export {
  executeCompleteMission,
  executeStartMission,
} from "./execution-core";
