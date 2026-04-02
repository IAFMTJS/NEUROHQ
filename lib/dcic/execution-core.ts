/**
 * Dark Commander Intelligence Core - Execution Core
 * ONLY place where gameState can be mutated
 * All mutations must go through here
 */

import type {
  ActionObject,
  GameState,
  Mission,
  BehaviourLogEntry,
} from "./types";
import { calculateRank } from "./simulation";
import { levelFromTotalXP, xpToNextLevel as xpRemainingToNextLevel } from "@/lib/xp";
import { updateDifficulty } from "./difficulty-engine";
import { getModeConfig } from "./mode-engine";
import { applyActiveEvents } from "./event-engine";
import { applyIdentityEffect } from "./identity-engine";
import { evaluateAbuse, recordMissionCompletionPattern } from "./anti-cheat";

/**
 * Helper to get mission name for logging
 */
function getMissionName(gameState: GameState, missionId: string): string {
  const mission = gameState.missions.find((m) => m.id === missionId);
  return mission?.name || "Unknown Mission";
}

/** Consequence multipliers from Resource & Consequence Engine (Fase 2). Applied when completing mission. */
export type ConsequenceMultipliers = {
  energyMultiplier: number; // 0.8 when energy depleted
  loadFailure: boolean; // true = 50% XP (25–40% chance when load > 80)
  recoveryPenalty: boolean; // true = 95% XP (5+ days inactive)
};

/**
 * Executes a complete_mission action
 * Mutates gameState
 */
export function executeCompleteMission(
  action: ActionObject,
  gameState: GameState,
  consequence?: ConsequenceMultipliers
): {
  success: boolean;
  updatedState: GameState;
  logEntry: BehaviourLogEntry;
  error?: string;
} {
  const missionId = action.data.missionId as string;
  if (!missionId) {
    return {
      success: false,
      updatedState: gameState,
      logEntry: createEmptyLogEntry(),
      error: "Missing mission ID",
    };
  }

  const mission = gameState.missions.find((m) => m.id === missionId);
  if (!mission) {
    return {
      success: false,
      updatedState: gameState,
      logEntry: createEmptyLogEntry(),
      error: "Mission not found",
    };
  }

  if (!mission.active || mission.completed) {
    return {
      success: false,
      updatedState: gameState,
      logEntry: createEmptyLogEntry(),
      error: "Mission not active or already completed",
    };
  }

  // Create deep copy to mutate
  const updatedState: GameState = JSON.parse(JSON.stringify(gameState));

  // Record energy before
  const energyBefore = updatedState.stats.energy;

  // Mark mission as completed
  const missionIndex = updatedState.missions.findIndex((m) => m.id === missionId);
  updatedState.missions[missionIndex].completed = true;
  updatedState.missions[missionIndex].active = false;
  updatedState.missions[missionIndex].completedAt = new Date().toISOString();

  // Calculate streak multiplier
  const streakMultiplier = Math.min(
    1 + updatedState.streak.current * 0.02,
    1.5
  );

  // Consequence (Fase 2): energy 0–1 → 0.8, load failure → 0.5, recovery → 0.95
  const energyMult = consequence?.energyMultiplier ?? 1;
  const loadMult = consequence?.loadFailure ? 0.5 : 1;
  const recoveryMult = consequence?.recoveryPenalty ? 0.95 : 1;

  const modeConfig = getModeConfig(updatedState);
  const eventEffects = applyActiveEvents(updatedState);

  let xpGain = Math.floor(
    mission.xpReward *
      streakMultiplier *
      energyMult *
      loadMult *
      recoveryMult *
      modeConfig.xpMultiplier *
      eventEffects.xpMultiplier
  );
  updatedState.currentXP += xpGain;
  syncXpLevelFields(updatedState);

  // Update streak
  updateStreak(updatedState);

  // Update rank and difficulty engine
  updatedState.rank = calculateRank(updatedState.level);
  updatedState.difficultyEngine = updateDifficulty(updatedState.level, updatedState.rank);

  // Check achievements (will be saved via server action)
  checkAchievements(updatedState, mission);
  applyIdentityEffect(updatedState, updatedState.mode.current);

  // Apply focus impact from events
  if (eventEffects.focusDelta !== 0) {
    updatedState.stats.focus = Math.max(
      0,
      Math.min(100, updatedState.stats.focus + eventEffects.focusDelta)
    );
  }

  // Deduct energy with mode multipliers applied
  updatedState.stats.energy = Math.max(
    0,
    updatedState.stats.energy - mission.energyCost * modeConfig.energyDrainMultiplier
  );

  // Fase 3: derive performance rank from consequence (missions have no full score formula).
  // Avoid defaulting to S so auto/template missions are not over-ranked; use A for "good" runs.
  let performanceRank: "S" | "A" | "B" | "C" = "A";
  let performanceScore: number = 82;
  if (consequence?.loadFailure) {
    performanceRank = "C";
    performanceScore = 52;
  } else if (consequence?.recoveryPenalty || (consequence && consequence.energyMultiplier < 1)) {
    performanceRank = "B";
    performanceScore = 72;
  } else if (!consequence?.loadFailure && !consequence?.recoveryPenalty && (consequence?.energyMultiplier ?? 1) >= 1) {
    performanceRank = "A";
    performanceScore = 82;
  }

  // Create log entry
  const logEntry: BehaviourLogEntry = {
    date: new Date().toISOString().split("T")[0],
    missionStartedAt: mission.startedAt,
    missionCompletedAt: updatedState.missions[missionIndex].completedAt,
    energyBefore,
    energyAfter: updatedState.stats.energy,
    resistedBeforeStart: false, // Tracked via assistantState signals
    difficultyLevel: mission.difficultyLevel,
    xpGained: xpGain,
    performanceScore,
    performanceRank,
    missionIntent: mission.missionIntent ?? "normal",
  };

  recordMissionCompletionPattern(updatedState, updatedState.missions[missionIndex]);
  const todayStr = new Date().toISOString().split("T")[0];
  const abuse = evaluateAbuse(updatedState, todayStr);
  if (abuse.level === "medium") {
    xpGain = Math.floor(xpGain * 0.7);
    updatedState.currentXP = Math.max(0, updatedState.currentXP - Math.floor(xpGain * 0.3));
    updatedState.identity.discipline = Math.max(
      0,
      updatedState.identity.discipline - 0.3
    );
  } else if (abuse.level === "high") {
    xpGain = Math.floor(xpGain * 0.5);
    updatedState.currentXP = Math.max(0, updatedState.currentXP - Math.floor(xpGain * 0.5));
    updatedState.identity.discipline = Math.max(
      0,
      updatedState.identity.discipline - 0.6
    );
    const now = new Date();
    const lockUntil = new Date(now.getTime() + 60 * 60 * 1000);
    updatedState.mode.lockedUntil = lockUntil.toISOString();
  }

  syncXpLevelFields(updatedState);
  updatedState.rank = calculateRank(updatedState.level);
  updatedState.difficultyEngine = updateDifficulty(updatedState.level, updatedState.rank);

  // Note: Logging happens in server action, not here

  return {
    success: true,
    updatedState,
    logEntry,
  };
}

/**
 * Executes a start_mission action
 * Mutates gameState
 */
export function executeStartMission(
  action: ActionObject,
  gameState: GameState
): {
  success: boolean;
  updatedState: GameState;
  logEntry: BehaviourLogEntry;
  error?: string;
} {
  const missionId = action.data.missionId as string;
  if (!missionId) {
    return {
      success: false,
      updatedState: gameState,
      logEntry: createEmptyLogEntry(),
      error: "Missing mission ID",
    };
  }

  const mission = gameState.missions.find((m) => m.id === missionId);
  if (!mission) {
    return {
      success: false,
      updatedState: gameState,
      logEntry: createEmptyLogEntry(),
      error: "Mission not found",
    };
  }

  if (mission.active || mission.completed) {
    return {
      success: false,
      updatedState: gameState,
      logEntry: createEmptyLogEntry(),
      error: "Mission already active or completed",
    };
  }

  // Create deep copy to mutate
  const updatedState: GameState = JSON.parse(JSON.stringify(gameState));

  const modeConfig = getModeConfig(updatedState);

  // Deactivate any currently active mission
  updatedState.missions.forEach((m) => {
    if (m.active) {
      m.active = false;
    }
  });

  // Activate the new mission
  const missionIndex = updatedState.missions.findIndex((m) => m.id === missionId);
  updatedState.missions[missionIndex].active = true;
  updatedState.missions[missionIndex].startedAt = new Date().toISOString();

  // Deduct energy
  const energyBefore = updatedState.stats.energy;
  updatedState.stats.energy = Math.max(
    0,
    updatedState.stats.energy - mission.energyCost * modeConfig.energyDrainMultiplier
  );

  // Create log entry
  const logEntry: BehaviourLogEntry = {
    date: new Date().toISOString().split("T")[0],
    missionStartedAt: updatedState.missions[missionIndex].startedAt,
    missionCompletedAt: null,
    energyBefore,
    energyAfter: updatedState.stats.energy,
    resistedBeforeStart: false, // Tracked via assistantState signals
    difficultyLevel: mission.difficultyLevel,
  };

  return {
    success: true,
    updatedState,
    logEntry,
  };
}

/** `user_xp.total_xp` is cumulative; level and remainder-to-next always derive from it (same as profile / lib/xp). */
function syncXpLevelFields(gameState: GameState): void {
  gameState.level = levelFromTotalXP(gameState.currentXP);
  gameState.xpToNextLevel = xpRemainingToNextLevel(gameState.currentXP);
}

/**
 * Updates streak
 */
function updateStreak(gameState: GameState): void {
  const today = new Date().toISOString().split("T")[0];
  const lastCompletion = gameState.streak.lastCompletionDate;

  if (lastCompletion === today) {
    // Already completed today, don't increment
    return;
  }

  if (lastCompletion === null) {
    // First completion
    gameState.streak.current = 1;
    gameState.streak.lastCompletionDate = today;
    return;
  }

  const lastDate = new Date(lastCompletion);
  const todayDate = new Date(today);
  const daysDiff = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 1) {
    // Consecutive day
    gameState.streak.current += 1;
  } else {
    // Streak broken, reset to 1
    gameState.streak.current = 1;
  }

  // Update longest streak
  if (gameState.streak.current > gameState.streak.longest) {
    gameState.streak.longest = gameState.streak.current;
  }

  gameState.streak.lastCompletionDate = today;
}

/**
 * Checks and unlocks achievements
 */
function checkAchievements(gameState: GameState, mission: Mission): void {
  // First mission
  if (
    !gameState.achievements.firstMission &&
    gameState.missions.some((m) => m.completed)
  ) {
    gameState.achievements.firstMission = true;
  }

  // Streak achievements
  if (!gameState.achievements.streak7 && gameState.streak.current >= 7) {
    gameState.achievements.streak7 = true;
  }
  if (!gameState.achievements.streak30 && gameState.streak.current >= 30) {
    gameState.achievements.streak30 = true;
  }

  // Level achievements
  if (!gameState.achievements.level10 && gameState.level >= 10) {
    gameState.achievements.level10 = true;
  }
  if (!gameState.achievements.level25 && gameState.level >= 25) {
    gameState.achievements.level25 = true;
  }
}

/**
 * Creates empty log entry
 */
function createEmptyLogEntry(): BehaviourLogEntry {
  return {
    date: new Date().toISOString().split("T")[0],
    missionStartedAt: null,
    missionCompletedAt: null,
    energyBefore: 0,
    energyAfter: 0,
    resistedBeforeStart: false,
    difficultyLevel: 0.5,
  };
}
