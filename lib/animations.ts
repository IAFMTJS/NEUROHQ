/**
 * Central animation constants for NEUROHQ.
 * Use with CSS classes in globals.css (e.g. hq-card-enter, hq-anim-fade-up).
 */

/** Stagger delay step (ms) for dashboard cards */
export const CARD_STAGGER_MS = 80;

/** Animation duration tokens (align with CSS --hq-duration-*) */
export const DURATION_FAST_MS = 150;
export const DURATION_NORMAL_MS = 300;
export const DURATION_SLOW_MS = 500;

/** Mascot event names for trigger('reward'), trigger('error'), etc. */
export const MASCOT_EVENTS = {
  IDLE: "idle",
  FOCUS: "focus",
  REWARD: "reward",
  ERROR: "error",
} as const;
