/**
 * Dark Commander Intelligence Core - Simulation Engine
 * Previews consequences before execution
 */

import { rankFromLevel } from "@/lib/rank-ladder";
import { levelFromTotalXP } from "@/lib/xp";
import type { GameState, Mission, SimulationResult } from "./types";

/**
 * Simulates completing a mission without mutating state
 */
export function simulateCompleteMission(
  mission: Mission,
  gameState: GameState
): SimulationResult {
  // Calculate streak multiplier (2% per day, capped at 50%)
  const streakMultiplier = Math.min(
    1 + gameState.streak.current * 0.02,
    1.5
  );

  // Calculate XP gain
  const baseXP = mission.xpReward;
  const xpGain = Math.floor(baseXP * streakMultiplier);

  // Calculate projected XP and level
  const projectedXP = gameState.currentXP + xpGain;
  const newLevel = levelFromTotalXP(projectedXP);
  const newRank = rankFromLevel(newLevel);

  // Calculate energy after mission
  const energyAfter = Math.max(0, gameState.stats.energy - mission.energyCost);

  // Calculate streak after completion
  const streakAfter = gameState.streak.current + 1;

  // Check for projected achievements
  const projectedAchievements = checkProjectedAchievements(
    gameState,
    newLevel,
    streakAfter
  );

  return {
    xpGain,
    newLevel,
    newRank,
    energyAfter,
    streakAfter,
    projectedAchievements,
  };
}

/**
 * Simulates starting a mission
 */
export function simulateStartMission(
  mission: Mission,
  gameState: GameState
): {
  energyAfter: number;
  projectedCompletionTime: string | null;
} {
  const energyAfter = Math.max(0, gameState.stats.energy - mission.energyCost);

  // Estimate completion time based on difficulty
  // Higher difficulty = longer duration (example: 30-90 minutes)
  const baseDuration = 30; // minutes
  const difficultyMultiplier = mission.difficultyLevel;
  const estimatedMinutes = Math.floor(
    baseDuration + difficultyMultiplier * 60
  );

  const completionTime = new Date();
  completionTime.setMinutes(completionTime.getMinutes() + estimatedMinutes);

  return {
    energyAfter,
    projectedCompletionTime: completionTime.toISOString(),
  };
}

/** Rank from level (1–100 ladder). */
export { rankFromLevel as calculateRank } from "@/lib/rank-ladder";

/**
 * Checks for projected achievements
 */
function checkProjectedAchievements(
  gameState: GameState,
  newLevel: number,
  streakAfter: number
): string[] {
  const achievements: string[] = [];

  // First mission achievement
  if (
    !gameState.achievements.firstMission &&
    gameState.missions.some((m) => m.completed)
  ) {
    achievements.push("firstMission");
  }

  // Streak achievements
  if (!gameState.achievements.streak7 && streakAfter >= 7) {
    achievements.push("streak7");
  }
  if (!gameState.achievements.streak30 && streakAfter >= 30) {
    achievements.push("streak30");
  }

  // Level achievements
  if (!gameState.achievements.level10 && newLevel >= 10) {
    achievements.push("level10");
  }
  if (!gameState.achievements.level25 && newLevel >= 25) {
    achievements.push("level25");
  }

  return achievements;
}
