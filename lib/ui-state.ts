/**
 * UI state machine: idle | focus | reward | error.
 * Used for mascot animations and global UI feedback (e.g. focus ring, error toast).
 */

export type UIState = "idle" | "focus" | "reward" | "error";

export const UI_STATES: UIState[] = ["idle", "focus", "reward", "error"];

/** Suggested duration (ms) before auto-transitioning from reward/error back to idle */
export const REWARD_DISPLAY_MS = 2000;
export const ERROR_DISPLAY_MS = 3000;
