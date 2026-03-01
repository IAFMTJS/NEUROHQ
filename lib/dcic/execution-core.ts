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
import { calculateLevel, calculateRank } from "./simulation";

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

  const xpGain = Math.floor(
    mission.xpReward * streakMultiplier * energyMult * loadMult * recoveryMult
  );
  updatedState.currentXP += xpGain;

  // Check for level up
  if (updatedState.currentXP >= updatedState.xpToNextLevel) {
    levelUp(updatedState);
  }

  // Update streak
  updateStreak(updatedState);

  // Update rank
  updatedState.rank = calculateRank(updatedState.level);

  // Check achievements (will be saved via server action)
  checkAchievements(updatedState, mission);

  // Deduct energy
  updatedState.stats.energy = Math.max(
    0,
    updatedState.stats.energy - mission.energyCost
  );

  // Fase 3: derive performance rank from consequence (missions have no full score formula)
  let performanceRank: "S" | "A" | "B" | "C" = "A";
  let performanceScore: number = 85;
  if (consequence?.loadFailure) {
    performanceRank = "C";
    performanceScore = 52;
  } else if (consequence?.recoveryPenalty || (consequence && consequence.energyMultiplier < 1)) {
    performanceRank = "B";
    performanceScore = 72;
  } else if (!consequence?.loadFailure && !consequence?.recoveryPenalty && (consequence?.energyMultiplier ?? 1) >= 1) {
    performanceRank = "S";
    performanceScore = 92;
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
    updatedState.stats.energy - mission.energyCost
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

/**
 * Level up logic
 */
function levelUp(gameState: GameState): void {
  gameState.currentXP -= gameState.xpToNextLevel;
  gameState.level += 1;
  gameState.xpToNextLevel = calculateXPForLevel(gameState.level);
}

/**
 * Calculates XP required for a specific level
 */
function calculateXPForLevel(level: number): number {
  if (level <= 4) {
    return 1000;
  }
  return Math.floor(1000 * Math.pow(1.15, level - 4));
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
