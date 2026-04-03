import type { GameState } from "./types";

export type OverdriveAutoReason = "momentum_combo" | "streak_rescue" | "weekly_slot";

export type OverdriveAutoContext = {
  nowMs: number;
  /** Hour 0–23 in app timezone (Europe/Amsterdam). */
  localHour: number;
  alreadyTriggeredToday: boolean;
  modeLocked: boolean;
  completionsInLast45m: number;
  completionsToday: number;
  streakAtRisk: boolean;
  /** Today is one of this user's two pseudo-random Overdrive weekdays for the Amsterdam ISO week. */
  weeklyRandomSlotToday: boolean;
  /** `weekly_slot` triggers already used this Amsterdam ISO week (Mon–Sun), max 2. */
  weeklySlotTriggersThisIsoWeek: number;
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

function hashStringToUint32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Two distinct weekdays (0=Sun … 6=Sat, Amsterdam convention) for this user × ISO week.
 * Deterministic from `userId` + Monday YMD so the same days apply all week, then change next week.
 */
export function pickWeeklySlotWeekdays(
  userId: string,
  weekMondayAmsterdamYmd: string
): ReadonlySet<number> {
  let seed = hashStringToUint32(`neurohq-weekly-od|${userId}|${weekMondayAmsterdamYmd}`);
  const days = [0, 1, 2, 3, 4, 5, 6];
  for (let i = days.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const j = seed % (i + 1);
    const tmp = days[i]!;
    days[i] = days[j]!;
    days[j] = tmp;
  }
  return new Set([days[0]!, days[1]!]);
}

/**
 * Pure decision: whether Overdrive should auto-trigger right now.
 *
 * Philosophy:
 * - Rare and bounded: at most once per local day.
 * - Never when capacity is low or when the system is already steering via Recovery/War locks.
 * - Mixed triggers: twice-weekly random weekdays + momentum + streak rescue.
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

  // Trigger 0: Twice per Amsterdam ISO week on pseudo-random weekdays (stable per user × week).
  if (
    ctx.weeklySlotTriggersThisIsoWeek < 2 &&
    ctx.weeklyRandomSlotToday &&
    isWithinWindow(ctx.localHour, 9, 20)
  ) {
    return { shouldTrigger: true, reason: "weekly_slot" };
  }

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

