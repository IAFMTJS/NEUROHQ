import type { GameState, Mission } from "./types";

const NINETY_MINUTES_MS = 90 * 60 * 1000;
/** Overdrive double-XP window (timer shown in UI). */
const OVERDRIVE_DURATION_MS = 6 * 60 * 60 * 1000;

type ModeKey = GameState["mode"]["current"];

type BaseModeConfig = {
  xpMultiplier: number;
  penaltyMultiplier: number;
  maxActiveMissions: number;
  allowAllMissions: boolean;
  allowDeepWork: boolean;
  energyDrainMultiplier: number;
  energyRegenMultiplier: number;
  focusRegenMultiplier: number;
  integrityImpact: number;
  lockable: boolean;
  /** Optional lock duration for lockable modes (ms). */
  duration?: number;
};

type WarStage = GameState["mode"]["warStage"];

type WarStageConfig = {
  xpMultiplier: number;
  penaltyMultiplier: number;
  focusDrainMultiplier: number;
  exitPenaltyMultiplier: number;
};

const MODE_CONFIG: Record<ModeKey, BaseModeConfig> = {
  focus: {
    xpMultiplier: 1.0,
    penaltyMultiplier: 1.0,
    maxActiveMissions: 5,
    allowAllMissions: true,
    allowDeepWork: true,
    energyDrainMultiplier: 1.0,
    energyRegenMultiplier: 1.0,
    focusRegenMultiplier: 1.0,
    integrityImpact: 1.0,
    lockable: false,
  },
  war: {
    xpMultiplier: 1.5,
    penaltyMultiplier: 2.0,
    maxActiveMissions: 1,
    allowAllMissions: false,
    allowDeepWork: true,
    energyDrainMultiplier: 1.5,
    energyRegenMultiplier: 0.5,
    focusRegenMultiplier: 0.8,
    integrityImpact: 2.0,
    lockable: true,
    duration: NINETY_MINUTES_MS,
  },
  recovery: {
    xpMultiplier: 0.5,
    penaltyMultiplier: 0,
    maxActiveMissions: 3,
    allowAllMissions: false,
    allowDeepWork: false,
    energyDrainMultiplier: 0.5,
    energyRegenMultiplier: 1.5,
    focusRegenMultiplier: 1.3,
    integrityImpact: 0.5,
    lockable: false,
  },
  overdrive: {
    xpMultiplier: 2.0,
    penaltyMultiplier: 1.0,
    maxActiveMissions: 5,
    allowAllMissions: true,
    allowDeepWork: true,
    energyDrainMultiplier: 1.05,
    energyRegenMultiplier: 1.0,
    focusRegenMultiplier: 1.0,
    integrityImpact: 1.0,
    lockable: true,
    duration: OVERDRIVE_DURATION_MS,
  },
};

const WAR_STAGE_CONFIG: Record<WarStage, WarStageConfig> = {
  1: {
    xpMultiplier: 1.5,
    penaltyMultiplier: 2.0,
    focusDrainMultiplier: 1.0,
    exitPenaltyMultiplier: 1.0,
  },
  2: {
    xpMultiplier: 1.8,
    penaltyMultiplier: 2.5,
    focusDrainMultiplier: 1.2,
    exitPenaltyMultiplier: 1.2,
  },
  3: {
    xpMultiplier: 2.2,
    penaltyMultiplier: 3.0,
    focusDrainMultiplier: 1.4,
    exitPenaltyMultiplier: 2.0,
  },
};

export type EffectiveModeConfig = BaseModeConfig & {
  warStage: WarStage;
  warStageConfig: WarStageConfig;
};

/**
 * Overheat: long continuous Overdrive reduces XP efficiency (not a burnout simulator).
 * Returns 0–1 multiplier applied on top of the ×2 base.
 */
export function getOverdriveHeatEfficiency(
  sessionStartIso: string | null | undefined,
  nowMs: number = Date.now()
): number {
  if (!sessionStartIso) return 1;
  const start = Date.parse(sessionStartIso);
  if (Number.isNaN(start)) return 1;
  const elapsedMin = (nowMs - start) / 60_000;
  if (elapsedMin < 45) return 1;
  if (elapsedMin < 90) return 0.88;
  if (elapsedMin < 150) return 0.72;
  return 0.55;
}

export function getModeConfig(gameState: GameState): EffectiveModeConfig {
  const modeKey = gameState.mode?.current ?? "focus";
  const base = MODE_CONFIG[modeKey];
  const warStage = gameState.mode?.warStage ?? 1;
  const warStageConfig =
    modeKey === "war" ? WAR_STAGE_CONFIG[warStage] : WAR_STAGE_CONFIG[1];

  if (modeKey === "overdrive") {
    const heat = getOverdriveHeatEfficiency(gameState.mode?.overdriveSessionStart, Date.now());
    return {
      ...base,
      xpMultiplier: base.xpMultiplier * heat,
      warStage: 1,
      warStageConfig: WAR_STAGE_CONFIG[1],
    };
  }

  if (modeKey !== "war") {
    return {
      ...base,
      warStage: 1,
      warStageConfig: WAR_STAGE_CONFIG[1],
    };
  }

  return {
    ...base,
    xpMultiplier: base.xpMultiplier * warStageConfig.xpMultiplier,
    penaltyMultiplier: base.penaltyMultiplier * warStageConfig.penaltyMultiplier,
    warStage,
    warStageConfig,
  };
}

export function isModeLocked(gameState: GameState, now: number = Date.now()): boolean {
  const lockedUntil = gameState.mode?.lockedUntil;
  if (!lockedUntil) return false;
  const lockedUntilMs = Date.parse(lockedUntil);
  if (Number.isNaN(lockedUntilMs)) return false;
  return lockedUntilMs > now;
}

export function canSwitchMode(
  gameState: GameState,
  newMode: ModeKey,
  now: number = Date.now()
): boolean {
  if (gameState.mode.current === newMode) return false;
  if (isModeLocked(gameState, now)) return false;
  const config = MODE_CONFIG[gameState.mode.current];
  if (
    config.lockable &&
    (gameState.mode.current === "war" || gameState.mode.current === "overdrive")
  ) {
    return false;
  }
  return true;
}

export function switchMode(
  gameState: GameState,
  newMode: ModeKey,
  options?: { forced?: boolean }
): void {
  const forced = options?.forced ?? false;
  const nowMs = Date.now();
  if (!forced && !canSwitchMode(gameState, newMode, nowMs)) {
    return;
  }

  const nowIso = new Date(nowMs).toISOString();
  const config = MODE_CONFIG[newMode];

  gameState.mode.current = newMode;
  gameState.mode.lastSwitch = nowIso;
  gameState.mode.suggested = null;

  if (newMode === "war") {
    gameState.mode.warStage = 1;
    gameState.mode.overdriveSessionStart = null;
  } else if (newMode === "overdrive") {
    gameState.mode.warStage = 1;
    gameState.mode.overdriveSessionStart = nowIso;
  } else {
    gameState.mode.warStage = 1;
    gameState.mode.nextWarBonus = gameState.mode.nextWarBonus ?? null;
    gameState.mode.overdriveSessionStart = null;
  }

  if (config.lockable && config.duration != null) {
    gameState.mode.lockedUntil = new Date(nowMs + config.duration).toISOString();
  } else {
    gameState.mode.lockedUntil = null;
  }
}

export function updateWarStage(gameState: GameState, warStartedAt: string | null): void {
  if (gameState.mode.current !== "war" || !warStartedAt) {
    gameState.mode.warStage = 1;
    return;
  }
  const startedMs = Date.parse(warStartedAt);
  if (Number.isNaN(startedMs)) {
    gameState.mode.warStage = 1;
    return;
  }
  const elapsed = Date.now() - startedMs;
  if (elapsed < 30 * 60 * 1000) {
    gameState.mode.warStage = 1;
  } else if (elapsed < 60 * 60 * 1000) {
    gameState.mode.warStage = 2;
  } else {
    gameState.mode.warStage = 3;
  }
}

export function autoModeCheck(gameState: GameState): void {
  if (gameState.mode.current === "overdrive") {
    return;
  }

  const avg = gameState.mode.brainStatusAveragePercent;

  /** Geen brain check-in vandaag (energy/focus ontbreken in daily_state): recovery tot check-in; daarna is focus de norm tussen de war/recovery-drempels. */
  if (avg == null) {
    if (gameState.mode.current !== "recovery") {
      switchMode(gameState, "recovery", { forced: true });
    }
    return;
  }

  if (avg < 25 && gameState.mode.current !== "recovery") {
    switchMode(gameState, "recovery", { forced: true });
    return;
  }
  if (avg > 75 && gameState.mode.current !== "war") {
    switchMode(gameState, "war", { forced: true });
    return;
  }

  const { energy, focus } = gameState.stats;

  if (focus > 70 && energy > 60) {
    if (!gameState.mode.suggested) {
      gameState.mode.suggested = "war";
    }
  }
}

export function filterAvailableMissions(gameState: GameState): Mission[] {
  const mode = gameState.mode.current;
  const missions = gameState.missions;

  if (mode === "war") {
    return missions.filter((m) => {
      if (m.missionIntent === "push") return true;
      if (m.missionType === "challenge") return true;
      return false;
    });
  }

  if (mode === "recovery") {
    return missions.filter((m) => m.missionIntent === "recovery");
  }

  return missions;
}

export function canActivateMission(gameState: GameState): boolean {
  const config = getModeConfig(gameState);
  const activeCount = gameState.missions.filter((m) => m.active && !m.completed).length;
  if (activeCount >= config.maxActiveMissions) {
    return false;
  }
  if (gameState.mode.current === "war" && isModeLocked(gameState)) {
    return activeCount === 0;
  }
  return true;
}

export function isRecoveryMission(mission: Mission): boolean {
  return mission.missionIntent === "recovery";
}

export function canStartMissionInCurrentMode(
  gameState: GameState,
  mission: Mission
): boolean {
  const mode = gameState.mode.current;
  if (mode === "recovery" && mission.missionIntent === "push") {
    return false;
  }
  return true;
}

export function passiveRecoveryTick(gameState: GameState): void {
  const mode = gameState.mode.current;
  if (mode !== "recovery") return;
  const config = getModeConfig(gameState);
  gameState.stats.energy = Math.min(
    100,
    gameState.stats.energy + 2 * config.energyRegenMultiplier
  );
  gameState.stats.focus = Math.min(
    100,
    gameState.stats.focus + 1 * config.focusRegenMultiplier
  );
}

