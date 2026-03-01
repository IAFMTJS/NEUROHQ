/**
 * Dark Commander Intelligence Core - Action Builder
 * Creates Action Objects from intents
 */

import type { ActionObject, Intent, Mission } from "./types";
import { simulateCompleteMission, simulateStartMission } from "./simulation";
import type { GameState } from "./types";

/**
 * Builds an Action Object from intent and context
 */
export function buildAction(
  intent: Intent,
  data: Record<string, unknown>,
  gameState: GameState
): ActionObject {
  const action: ActionObject = {
    type: intent,
    priority: calculatePriority(intent),
    requiresConfirmation: requiresConfirmation(intent),
    data,
    simulation: null,
  };

  // Add simulation if applicable
  if (intent === "complete_mission" && data.missionId) {
    const mission = gameState.missions.find(
      (m) => m.id === data.missionId
    );
    if (mission) {
      action.simulation = simulateCompleteMission(mission, gameState);
    }
  }

  if (intent === "start_mission" && data.missionId) {
    const mission = gameState.missions.find(
      (m) => m.id === data.missionId
    );
    if (mission) {
      const sim = simulateStartMission(mission, gameState);
      // Convert to SimulationResult format for consistency
      action.simulation = {
        xpGain: 0, // No XP gain on start
        newLevel: gameState.level,
        newRank: gameState.rank,
        energyAfter: sim.energyAfter,
        streakAfter: gameState.streak.current,
        projectedAchievements: [],
      };
    }
  }

  return action;
}

/**
 * Calculates priority for an action
 * Higher number = higher priority
 */
function calculatePriority(intent: Intent): number {
  const priorities: Record<Intent, number> = {
    complete_mission: 10, // High priority - completing active work
    start_mission: 8, // High priority - starting work
    create_calendar_event: 6, // Medium priority - planning
    ask_status: 2, // Low priority - informational
    resistance: 3, // Low priority - signal only
    confirm_action: 9, // High priority - user confirmation
    unknown: 0, // No priority - unknown
  };

  return priorities[intent] ?? 0;
}

/**
 * Determines if an action requires confirmation
 */
function requiresConfirmation(intent: Intent): boolean {
  // All persistent actions require confirmation
  const persistentActions: Intent[] = [
    "complete_mission",
    "start_mission",
    "create_calendar_event",
  ];

  return persistentActions.includes(intent);
}

/**
 * Creates a confirmation action
 */
export function buildConfirmationAction(
  pendingAction: ActionObject,
  confirmed: boolean
): ActionObject {
  return {
    type: "confirm_action",
    priority: 9,
    requiresConfirmation: false,
    data: {
      pendingActionId: pendingAction.type,
      confirmed,
      originalAction: pendingAction,
    },
    simulation: null,
  };
}
