/**
 * Dark Commander Intelligence Core - State Gatekeeper
 * Pre-execution validation to ensure actions are safe to execute
 */

import type { ActionObject, GameState, ValidationResult } from "./types";

/**
 * Validates an action before execution
 * Returns validation result with reason if invalid
 */
export function validateAction(
  action: ActionObject,
  gameState: GameState
): ValidationResult {
  switch (action.type) {
    case "complete_mission":
      return validateCompleteMission(action, gameState);

    case "start_mission":
      return validateStartMission(action, gameState);

    case "create_calendar_event":
      return validateCreateCalendarEvent(action);

    case "ask_status":
      // Status queries are always valid (read-only)
      return { valid: true };

    case "resistance":
      // Resistance signals are always valid (no state mutation)
      return { valid: true };

    case "confirm_action":
      // Confirmation requires pending action
      if (!action.data.pendingActionId) {
        return { valid: false, reason: "No pending action to confirm" };
      }
      return { valid: true };

    case "unknown":
      return { valid: false, reason: "Unknown intent cannot be executed" };

    default:
      return { valid: false, reason: "Invalid action type" };
  }
}

function validateCompleteMission(
  action: ActionObject,
  gameState: GameState
): ValidationResult {
  const missionId = action.data.missionId;
  if (!missionId) {
    return { valid: false, reason: "Missing mission ID" };
  }

  const mission = gameState.missions.find((m) => m.id === missionId);
  if (!mission) {
    return { valid: false, reason: "Mission not found" };
  }

  if (!mission.active) {
    return { valid: false, reason: "No active mission to complete" };
  }

  if (mission.completed) {
    return { valid: false, reason: "Mission already completed" };
  }

  if (gameState.stats.energy <= 5) {
    return {
      valid: false,
      reason: `Insufficient energy. Current: ${gameState.stats.energy}, Required: 5`,
    };
  }

  return { valid: true };
}

function validateStartMission(
  action: ActionObject,
  gameState: GameState
): ValidationResult {
  // Check if mission already active
  const activeMission = gameState.missions.find((m) => m.active);
  if (activeMission) {
    return {
      valid: false,
      reason: `Mission "${activeMission.name}" is already active`,
    };
  }

  // Check energy requirement
  if (gameState.stats.energy <= 10) {
    return {
      valid: false,
      reason: `Insufficient energy. Current: ${gameState.stats.energy}, Required: 10`,
    };
  }

  // If specific mission ID provided, validate it exists
  if (action.data.missionId) {
    const mission = gameState.missions.find((m) => m.id === action.data.missionId);
    if (!mission) {
      return { valid: false, reason: "Mission not found" };
    }
    if (mission.completed) {
      return { valid: false, reason: "Mission already completed" };
    }
  }

  return { valid: true };
}

function validateCreateCalendarEvent(action: ActionObject): ValidationResult {
  if (!action.data.date) {
    return { valid: false, reason: "Missing date" };
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(action.data.date)) {
    return { valid: false, reason: "Invalid date format" };
  }

  // Validate date is not in the past (optional, can be relaxed)
  const date = new Date(action.data.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return { valid: false, reason: "Cannot create events in the past" };
  }

  return { valid: true };
}
