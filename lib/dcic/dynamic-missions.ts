import type { GameState } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Dynamic mission tick.
 * - Expires missions whose expiresAt is in the past
 * - Applies volatility-based XP/risk adjustments to keep the pool alive
 */
export function updateDynamicMissions(gameState: GameState, now: number = Date.now()): void {
  const nowIso = new Date(now).toISOString();

  gameState.missions = gameState.missions
    .map((mission) => {
      if (!mission.expiresAt) {
        return mission;
      }

      const expiresMs = Date.parse(mission.expiresAt);
      if (!Number.isNaN(expiresMs) && expiresMs < now) {
        if (mission.completed || mission.active) {
          return mission;
        }
        return null;
      }

      const volatility = mission.volatility ?? 0;
      if (volatility <= 0) {
        return mission;
      }

      const roll = Math.random();
      if (roll < volatility * 0.15) {
        const factor = 1 + volatility * 0.8;
        const nextXp = Math.floor(mission.xpReward * factor);
        const riskLevel =
          nextXp >= mission.xpReward * 2
            ? "high"
            : nextXp >= mission.xpReward * 1.4
            ? "medium"
            : "low";

        const newExpiresAt = new Date(now + DAY_MS).toISOString();

        return {
          ...mission,
          xpReward: nextXp,
          riskLevel,
          expiresAt: newExpiresAt,
        };
      }

      return mission;
    })
    .filter((m): m is NonNullable<(typeof gameState.missions)[number]> => m != null);

  for (const mission of gameState.missions) {
    if (!mission.expiresAt && (mission.volatility ?? 0) > 0) {
      mission.expiresAt = nowIso;
    }
  }
}

