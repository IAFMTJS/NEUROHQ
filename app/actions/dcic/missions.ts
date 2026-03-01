/**
 * Dark Commander Intelligence Core - Mission Management Server Actions
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getGameState, saveGameState } from "./game-state";
import { validateAction } from "@/lib/dcic/state-gatekeeper";
import { buildAction } from "@/lib/dcic/action-builder";
import {
  executeCompleteMission,
  executeStartMission,
} from "@/lib/dcic/execution-core";
import type { ActionObject } from "@/lib/dcic/types";

/**
 * Starts a mission
 * Full flow: validate → simulate → confirm → execute
 */
export async function startMission(missionId: string): Promise<{
  success: boolean;
  simulation?: unknown;
  error?: string;
}> {
  const gameState = await getGameState();
  if (!gameState) {
    return { success: false, error: "Game state not found" };
  }

  // Build action
  const action = buildAction("start_mission", { missionId }, gameState);

  // Validate
  const validation = validateAction(action, gameState);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  // Return simulation for confirmation
  return {
    success: true,
    simulation: action.simulation,
  };
}

/**
 * Confirms and executes start mission
 */
export async function confirmStartMission(missionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const gameState = await getGameState();
  if (!gameState) {
    return { success: false, error: "Game state not found" };
  }

  const action = buildAction("start_mission", { missionId }, gameState);
  const validation = validateAction(action, gameState);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  // Execute
  const result = executeStartMission(action, gameState);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Save to database
  const saved = await saveGameState(result.updatedState);
  if (!saved) {
    return { success: false, error: "Failed to save game state" };
  }

  // Log behaviour entry
  const { logBehaviourEntry } = await import("./behaviour-log");
  await logBehaviourEntry({
    ...result.logEntry,
    missionId: missionId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { success: true };
}

/**
 * Completes a mission
 * Full flow: validate → simulate → confirm → execute
 */
export async function completeMission(missionId: string): Promise<{
  success: boolean;
  simulation?: unknown;
  error?: string;
}> {
  const gameState = await getGameState();
  if (!gameState) {
    return { success: false, error: "Game state not found" };
  }

  // Build action
  const action = buildAction("complete_mission", { missionId }, gameState);

  // Validate
  const validation = validateAction(action, gameState);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  // Return simulation for confirmation
  return {
    success: true,
    simulation: action.simulation,
  };
}

/**
 * Confirms and executes complete mission
 */
export async function confirmCompleteMission(missionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const gameState = await getGameState();
  if (!gameState) {
    return { success: false, error: "Game state not found" };
  }

  const action = buildAction("complete_mission", { missionId }, gameState);
  const validation = validateAction(action, gameState);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  const today = new Date().toISOString().slice(0, 10);
  const { getConsequenceState } = await import("@/app/actions/consequence-engine");
  const consequenceState = await getConsequenceState(today);
  const consequence = {
    energyMultiplier: consequenceState.energyDepleted ? 0.8 : 1,
    loadFailure: consequenceState.loadOver80 && Math.random() < 0.32,
    recoveryPenalty: consequenceState.recoveryProtocol,
  };

  const result = executeCompleteMission(action, gameState, consequence);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Save to database
  const saved = await saveGameState(result.updatedState);
  if (!saved) {
    return { success: false, error: "Failed to save game state" };
  }

  // Log behaviour entry
  const { logBehaviourEntry } = await import("./behaviour-log");
  await logBehaviourEntry({
    ...result.logEntry,
    missionId: missionId,
  });

  // Check and unlock achievements
  const { checkAndUnlockAchievements } = await import("./achievements");
  const completedMissions = result.updatedState.missions.filter((m) => m.completed).length;
  await checkAndUnlockAchievements({
    level: result.updatedState.level,
    streak: result.updatedState.streak.current,
    missionsCompleted: completedMissions,
  });

  // Check and unlock skills
  const { checkAndUnlockSkills } = await import("./skills");
  await checkAndUnlockSkills({
    level: result.updatedState.level,
    streak: result.updatedState.streak.current,
    missionsCompleted: completedMissions,
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { success: true };
}
