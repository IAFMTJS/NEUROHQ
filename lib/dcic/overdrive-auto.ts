import type { GameState } from "./types";

export type OverdriveAutoReason = "momentum_combo" | "streak_rescue";

export type OverdriveAutoContext = {
  nowMs: number;
  localHour: number;
  alreadyTriggeredToday: boolean;
  modeLocked: boolean;
  completionsInLast45m: number;
  completionsToday: number;
  streakAtRisk: boolean;
};

export type OverdriveAutoDecision =
  | { shouldTrigger: false; reason: null }
  | { shouldTrigger: true; reason: OverdriveAutoReason };

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function isWithinWindow(hour: number, startInclusive: number, endInclusive: number): boolean {
  const h = clamp(hour, 0, 23);
  return h >= startInclusive && h <= endInclusive;
}

/**
 * Pure decision: whether Overdrive should auto-trigger right now.
 *
 * Philosophy:
 * - Rare and bounded: at most once per local day.
 * - Never when capacity is low or when the system is already steering via Recovery/War locks.
 * - Mixed triggers: momentum reward + streak rescue conversion.
 */
export function maybeAutoTriggerOverdrive(
  gameState: GameState,
  ctx: OverdriveAutoContext
): OverdriveAutoDecision {
  if (ctx.alreadyTriggeredToday) return { shouldTrigger: false, reason: null };
  if (ctx.modeLocked) return { shouldTrigger: false, reason: null };
  if (gameState.mode.current === "overdrive") return { shouldTrigger: false, reason: null };
  if (gameState.mode.current === "recovery") return { shouldTrigger: false, reason: null };
  if (gameState.mode.current === "war") return { shouldTrigger: false, reason: null };

  const avg = gameState.mode.brainStatusAveragePercent;
  if (avg == null) return { shouldTrigger: false, reason: null };

  // Guardrails: only when capacity looks safe.
  if (avg < 35) return { shouldTrigger: false, reason: null };
  if (gameState.stats.energy < 60) return { shouldTrigger: false, reason: null };
  if (gameState.stats.focus < 60) return { shouldTrigger: false, reason: null };
  if (gameState.stats.load > 70) return { shouldTrigger: false, reason: null };

  // Trigger 1: Momentum combo (3+ completions inside 45 minutes).
  if (ctx.completionsInLast45m >= 3) {
    return { shouldTrigger: true, reason: "momentum_combo" };
  }

  // Trigger 2: Streak rescue conversion (late-day, first completion of the day).
  if (
    ctx.streakAtRisk &&
    isWithinWindow(ctx.localHour, 17, 21) &&
    ctx.completionsToday === 1 &&
    ctx.completionsInLast45m >= 1
  ) {
    return { shouldTrigger: true, reason: "streak_rescue" };
  }

  return { shouldTrigger: false, reason: null };
}

