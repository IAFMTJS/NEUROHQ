import type { GameState } from "./types";

type TraitKey = keyof GameState["identity"];

export function increaseTrait(
  gameState: GameState,
  trait: Exclude<TraitKey, "constraints">,
  delta: number
): void {
  const current = gameState.identity[trait] ?? 0;
  const next = Math.max(0, Math.min(10, current + delta));
  gameState.identity[trait] = next;
}

export function applyIdentityEffect(gameState: GameState, mode: GameState["mode"]["current"]): void {
  if (mode === "war") {
    increaseTrait(gameState, "discipline", 0.2);
  } else if (mode === "recovery") {
    increaseTrait(gameState, "resilience", 0.2);
  } else if (mode === "overdrive") {
    increaseTrait(gameState, "discipline", 0.12);
    increaseTrait(gameState, "consistency", 0.12);
  } else if (mode === "focus") {
    increaseTrait(gameState, "consistency", 0.1);
  }
  checkIdentityLocks(gameState);
}

export function checkIdentityLocks(gameState: GameState): void {
  const { discipline, consistency } = gameState.identity;
  if (discipline > 8) {
    gameState.identity.constraints.noExcusesConstraint = true;
  }
  if (consistency > 8) {
    gameState.identity.constraints.dailyWarRequired = true;
  }
}

