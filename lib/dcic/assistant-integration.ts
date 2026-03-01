/**
 * Dark Commander Intelligence Core - Assistant Integration
 * Bridges DCIC with existing assistant API
 */

import { getGameState } from "@/app/actions/dcic/game-state";
import { startMission, completeMission } from "@/app/actions/dcic/missions";
import { classifyDCICIntent, extractTimeReference } from "./intent-classifier";
import { buildAction } from "./action-builder";
import { validateAction } from "./state-gatekeeper";
import type { Intent, ActionObject } from "./types";

export interface DCICResponse {
  isDCICAction: boolean;
  intent?: Intent;
  action?: ActionObject;
  simulation?: unknown;
  requiresConfirmation: boolean;
  error?: string;
  responseText?: string;
}

/**
 * Processes message through DCIC pipeline
 * Returns DCIC response if mission-related, null otherwise
 */
export async function processDCICMessage(
  message: string
): Promise<DCICResponse | null> {
  // Classify intent
  const intent = classifyDCICIntent(message);
  if (!intent) {
    return null; // Not a DCIC action
  }

  // Get game state
  const gameState = await getGameState();
  if (!gameState) {
    return {
      isDCICAction: true,
      intent,
      requiresConfirmation: false,
      error: "Game state not found",
      responseText: "Kon game state niet laden. Probeer het opnieuw.",
    };
  }

  // Extract data from message
  const timeRef = extractTimeReference(message);
  
  // For start/complete, find active mission or first available mission
  let missionId: string | undefined;
  if (intent === "start_mission" || intent === "complete_mission") {
    // Try to extract mission ID from message first
    const { extractMissionId } = await import("./intent-classifier");
    const extractedId = await extractMissionId(message);
    
    if (intent === "complete_mission") {
      // Find active mission or use extracted ID
      if (extractedId) {
        const mission = gameState.missions.find((m) => m.id === extractedId);
        if (mission && mission.active) {
          missionId = extractedId;
        }
      }
      
      if (!missionId) {
        const activeMission = gameState.missions.find((m) => m.active);
        if (!activeMission) {
          return {
            isDCICAction: true,
            intent,
            requiresConfirmation: false,
            error: "No active mission",
            responseText: "Geen actieve missie om te voltooien.",
          };
        }
        missionId = activeMission.id;
      }
    } else {
      // Start mission: use extracted ID or find first available
      if (extractedId) {
        const mission = gameState.missions.find((m) => m.id === extractedId);
        if (mission && !mission.completed && !mission.active) {
          missionId = extractedId;
        }
      }
      
      if (!missionId) {
        const availableMission = gameState.missions.find(
          (m) => !m.completed && !m.active
        );
        if (!availableMission) {
          return {
            isDCICAction: true,
            intent,
            requiresConfirmation: false,
            error: "No available missions",
            responseText: "Geen beschikbare missies om te starten.",
          };
        }
        missionId = availableMission.id;
      }
    }
  }

  // Build action
  const actionData: Record<string, unknown> = {
    ...(missionId && { missionId }),
    ...(timeRef.date && { date: timeRef.date }),
    ...(timeRef.time && { time: timeRef.time }),
  };

  const action = buildAction(intent, actionData, gameState);

  // Validate
  const validation = validateAction(action, gameState);
  if (!validation.valid) {
    return {
      isDCICAction: true,
      intent,
      action,
      requiresConfirmation: false,
      error: validation.reason,
      responseText: validation.reason || "Actie kan niet worden uitgevoerd.",
    };
  }

  // Get simulation
  let simulation: unknown = null;
  if (intent === "start_mission" && missionId) {
    const result = await startMission(missionId);
    if (result.success) {
      simulation = result.simulation;
    }
  } else if (intent === "complete_mission" && missionId) {
    const result = await completeMission(missionId);
    if (result.success) {
      simulation = result.simulation;
    }
  } else {
    simulation = action.simulation;
  }

  // Generate response text
  const responseText = generateResponseText(intent, action, gameState, simulation);

  return {
    isDCICAction: true,
    intent,
    action,
    simulation,
    requiresConfirmation: action.requiresConfirmation,
    responseText,
  };
}

/**
 * Generates response text for DCIC actions
 */
function generateResponseText(
  intent: Intent,
  action: ActionObject,
  gameState: any,
  simulation: any
): string {
  switch (intent) {
    case "start_mission":
      if (simulation) {
        return `Missie klaar om te starten. Energie na start: ${simulation.energyAfter}/100. Bevestig om te starten.`;
      }
      return "Missie klaar om te starten. Bevestig om te starten.";

    case "complete_mission":
      if (simulation) {
        const parts = [
          `Missie voltooien?`,
          `XP Gain: +${simulation.xpGain}`,
          `Energie na: ${simulation.energyAfter}/100`,
          `Streak: ${simulation.streakAfter} dagen`,
        ];
        if (simulation.newLevel > gameState.level) {
          parts.push(`Level up naar ${simulation.newLevel}!`);
        }
        if (simulation.projectedAchievements.length > 0) {
          parts.push(`Achievements: ${simulation.projectedAchievements.join(", ")}`);
        }
        return parts.join(" | ") + " Bevestig om te voltooien.";
      }
      return "Missie klaar om te voltooien. Bevestig om te voltooien.";

    case "create_calendar_event":
      return `Planning voor ${action.data.date || "morgen"} gemaakt. Bevestig om toe te voegen.`;

    case "ask_status":
      return `Level: ${gameState.level} | XP: ${gameState.currentXP} | Streak: ${gameState.streak.current} dagen | Energie: ${gameState.stats.energy}/100`;

    case "resistance":
      return "Ik merk weerstand. Wil je je streak behouden? Een korte missie kan helpen.";

    default:
      return "Actie herkend. Bevestig om uit te voeren.";
  }
}
