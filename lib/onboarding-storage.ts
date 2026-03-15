/**
 * Tutorial/onboarding state — device-specific, localStorage only.
 * Keys: neurohq_tutorial_completed, neurohq_tutorial_mode, neurohq_tutorial_step,
 * neurohq_tutorial_skipped, neurohq_tips_seen, neurohq_routes_visited, neurohq_setup_reminder_dismissed.
 */

const KEY_COMPLETED = "neurohq_tutorial_completed";
const KEY_MODE = "neurohq_tutorial_mode";
const KEY_STEP = "neurohq_tutorial_step";
const KEY_SKIPPED = "neurohq_tutorial_skipped";
const KEY_TIPS_SEEN = "neurohq_tips_seen";
const KEY_ROUTES_VISITED = "neurohq_routes_visited";
const KEY_SETUP_REMINDER_DISMISSED = "neurohq_setup_reminder_dismissed";
const MAX_ROUTES_VISITED = 32;

export type TutorialMode = "quick" | "full";

export type TutorialState = {
  completed: boolean;
  mode: TutorialMode | null;
  step: number;
};

function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage;
}

export function getTutorialState(): TutorialState {
  const storage = safeLocalStorage();
  if (!storage) {
    return { completed: false, mode: null, step: 0 };
  }
  try {
    const completed = storage.getItem(KEY_COMPLETED) === "true";
    const modeRaw = storage.getItem(KEY_MODE);
    const mode: TutorialMode | null =
      modeRaw === "quick" || modeRaw === "full" ? modeRaw : null;
    const stepRaw = storage.getItem(KEY_STEP);
    const step = stepRaw != null ? Math.max(0, parseInt(stepRaw, 10) || 0) : 0;
    return { completed, mode, step };
  } catch {
    return { completed: false, mode: null, step: 0 };
  }
}

/** Call when user completes the tour (reaches end). Clears skipped so setup reminder is not shown. */
export function setTutorialCompleted(): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(KEY_COMPLETED, "true");
    storage.removeItem(KEY_SKIPPED);
  } catch {
    // ignore
  }
}

/** Call when user skips the tutorial. Sets both completed and skipped. */
export function setTutorialSkipped(): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(KEY_COMPLETED, "true");
    storage.setItem(KEY_SKIPPED, "true");
  } catch {
    // ignore
  }
}

export function getTutorialSkipped(): boolean {
  const storage = safeLocalStorage();
  if (!storage) return false;
  try {
    return storage.getItem(KEY_SKIPPED) === "true";
  } catch {
    return false;
  }
}

export function setTutorialMode(mode: TutorialMode): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(KEY_MODE, mode);
  } catch {
    // ignore
  }
}

export function setTutorialStep(step: number): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(KEY_STEP, String(Math.max(0, step)));
  } catch {
    // ignore
  }
}

export function clearTutorialState(): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(KEY_COMPLETED);
    storage.removeItem(KEY_MODE);
    storage.removeItem(KEY_STEP);
    storage.removeItem(KEY_SKIPPED);
    storage.removeItem(KEY_SETUP_REMINDER_DISMISSED);
  } catch {
    // ignore
  }
}

// --- Contextual tips (first-visit tooltips) ---

export function getTipsSeen(): Record<string, boolean> {
  const storage = safeLocalStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(KEY_TIPS_SEEN);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function markTipSeen(tipId: string): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    const prev = getTipsSeen();
    prev[tipId] = true;
    storage.setItem(KEY_TIPS_SEEN, JSON.stringify(prev));
  } catch {
    // ignore
  }
}

// --- Routes visited (for "never visited" in Settings) ---

export function getRoutesVisited(): string[] {
  const storage = safeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(KEY_ROUTES_VISITED);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]).filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function addRouteVisited(path: string): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    const prev = getRoutesVisited();
    const normalized = path.split("?")[0] ?? path;
    if (prev.includes(normalized)) return;
    const next = [...prev, normalized].slice(-MAX_ROUTES_VISITED);
    storage.setItem(KEY_ROUTES_VISITED, JSON.stringify(next));
  } catch {
    // ignore
  }
}

// --- Setup reminder (after skip) ---

export function getSetupReminderDismissed(): boolean {
  const storage = safeLocalStorage();
  if (!storage) return false;
  try {
    return storage.getItem(KEY_SETUP_REMINDER_DISMISSED) === "true";
  } catch {
    return false;
  }
}

export function setSetupReminderDismissed(): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(KEY_SETUP_REMINDER_DISMISSED, "true");
  } catch {
    // ignore
  }
}
