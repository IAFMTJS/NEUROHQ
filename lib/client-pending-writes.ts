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
  physical_health?: number;
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
    queueDailySnapshotMerge();
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

function queueDailySnapshotMerge(): void {
  if (typeof window === "undefined") return;
  void import("@/lib/daily-snapshot-full-sync").then((m) => m.scheduleSyncDailySnapshot());
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void syncPending();
  }, SYNC_DEBOUNCE_MS);
}

function getUnsyncedEntries(): Array<{ date: string; state: PendingDailyState }> {
  if (typeof window === "undefined") return [];
  const out: Array<{ date: string; state: PendingDailyState }> = [];
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(DAILY_STATE_PREFIX)) continue;
      const date = key.slice(DAILY_STATE_PREFIX.length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as PendingDailyState;
      if (parsed._synced === true) continue;
      out.push({ date, state: parsed });
    }
  } catch {
    return [];
  }
  out.sort((a, b) => a.state._updatedAt - b.state._updatedAt);
  return out;
}

export async function syncPendingDailyStateNow(): Promise<void> {
  await syncPending();
}

async function syncPending(): Promise<void> {
  if (typeof window === "undefined") return;
  const pending = getUnsyncedEntries();
  if (pending.length === 0) return;
  let didSyncAny = false;
  try {
    const { saveDailyState } = await import("@/app/actions/daily-state");
    for (const item of pending) {
      const result = await saveDailyState({
        date: item.date,
        energy: item.state.energy,
        focus: item.state.focus,
        sensory_load: item.state.sensory_load,
        sleep_hours: item.state.sleep_hours,
        social_load: item.state.social_load,
        physical_health: item.state.physical_health ?? null,
        mental_battery: item.state.mental_battery,
      });
      if (!result.ok) continue;
      markDailyStateSynced(item.date);
      didSyncAny = true;
    }
    if (didSyncAny) {
      queueDailySnapshotMerge();
    }
  } catch (err) {
    console.error("[pending-writes] sync daily_state failed:", err);
  }
}
