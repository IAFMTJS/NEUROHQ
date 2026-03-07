/**
 * Local-first writes: store changes in localStorage immediately, then sync to Supabase after 5s idle.
 * Keys: hq-daily-state-${date} (daily_state).
 */

const DAILY_STATE_PREFIX = "hq-daily-state-";
const SYNC_DEBOUNCE_MS = 5000;

export type PendingDailyState = {
  energy: number;
  focus: number;
  sensory_load: number;
  sleep_hours: number | null;
  social_load: number;
  mental_battery: number;
  _updatedAt: number;
  _synced?: boolean;
};

function dailyStateKey(date: string): string {
  return `${DAILY_STATE_PREFIX}${date}`;
}

/** Get pending daily state from localStorage (for display). Strips _updatedAt / _synced. */
export function getPendingDailyState(date: string): Omit<PendingDailyState, "_updatedAt" | "_synced"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(dailyStateKey(date));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingDailyState;
    const { _updatedAt, _synced, ...state } = parsed;
    return state as Omit<PendingDailyState, "_updatedAt" | "_synced">;
  } catch {
    return null;
  }
}

/** Check if there is pending (unsynced) daily state for date. */
export function hasUnsyncedDailyState(date: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(dailyStateKey(date));
    if (!raw) return false;
    const parsed = JSON.parse(raw) as PendingDailyState;
    return parsed._synced !== true;
  } catch {
    return false;
  }
}

/** Write daily state to localStorage and schedule background sync. */
export function setPendingDailyState(
  date: string,
  state: Omit<PendingDailyState, "_updatedAt" | "_synced">
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PendingDailyState = {
      ...state,
      _updatedAt: Date.now(),
      _synced: false,
    };
    window.localStorage.setItem(dailyStateKey(date), JSON.stringify(payload));
    scheduleSync();
  } catch {
    // ignore
  }
}

/** Mark daily state as synced (after successful server save). */
export function markDailyStateSynced(date: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(dailyStateKey(date));
    if (!raw) return;
    const parsed = JSON.parse(raw) as PendingDailyState;
    parsed._synced = true;
    window.localStorage.setItem(dailyStateKey(date), JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    syncPending();
  }, SYNC_DEBOUNCE_MS);
}

async function syncPending(): Promise<void> {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const key = dailyStateKey(today);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw) as PendingDailyState;
    if (parsed._synced === true) return;
    const { saveDailyState } = await import("@/app/actions/daily-state");
    const result = await saveDailyState({
      date: today,
      energy: parsed.energy,
      focus: parsed.focus,
      sensory_load: parsed.sensory_load,
      sleep_hours: parsed.sleep_hours,
      social_load: parsed.social_load,
      mental_battery: parsed.mental_battery,
    });
    if (result.ok) {
      markDailyStateSynced(today);
    }
  } catch (err) {
    console.error("[pending-writes] sync daily_state failed:", err);
  }
}
