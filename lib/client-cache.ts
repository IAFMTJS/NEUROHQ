// Lightweight client-side cache helpers for daily snapshots, mutation queues,
// and UI preferences. All keys are scoped by user + date to avoid collisions
// between users on shared devices.
//
// Conflict resolution: when merging server data with a local snapshot, prefer
// the local piece if the user last mutated it after the server's update. Use
// isLocalSnapshotNewerThan(snapshot, serverUpdatedAt) to decide.

const STORAGE_PREFIX = "neurohq";

type DailySnapshot<T> = {
  data: T;
  /** ISO string when the snapshot was last updated due to a user-facing mutation. */
  lastMutationAt?: string;
  /** ISO date key (YYYY-MM-DD) for sanity checks. */
  dateKey: string;
};

type QueuedMutation = {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
};

function safeGetLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Best-effort user identifier for scoping cache.
 *
 * Server may choose to set this in localStorage or via a small inline script.
 * If not present, we fall back to a stable "anon" bucket so the cache still works.
 */
function getClientUserId(): string {
  const ls = safeGetLocalStorage();
  if (!ls) return "anon";
  try {
    const explicit = ls.getItem(`${STORAGE_PREFIX}:user-id`);
    if (explicit) return explicit;
  } catch {
    // ignore
  }
  return "anon";
}

function buildDailyKey(suffix: string, dateOverride?: string): string {
  const userId = getClientUserId();
  const dateKey = dateOverride ?? getTodayKey();
  return `${STORAGE_PREFIX}:daily:${userId}:${dateKey}:${suffix}`;
}

export function loadDailySnapshot<T>(suffix: string): DailySnapshot<T> | null {
  const ls = safeGetLocalStorage();
  if (!ls) return null;
  const dateKey = getTodayKey();
  const key = buildDailyKey(suffix, dateKey);
  try {
    const raw = ls.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailySnapshot<T>;
    if (!parsed || parsed.dateKey !== dateKey || typeof parsed.data === "undefined") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDailySnapshot<T>(
  suffix: string,
  data: T,
  opts?: { lastMutationAt?: string }
): void {
  const ls = safeGetLocalStorage();
  if (!ls) return;
  const dateKey = getTodayKey();
  const key = buildDailyKey(suffix, dateKey);
  const snapshot: DailySnapshot<T> = {
    data,
    dateKey,
    ...(opts?.lastMutationAt ? { lastMutationAt: opts.lastMutationAt } : {}),
  };
  try {
    ls.setItem(key, JSON.stringify(snapshot));
  } catch {
    // Best-effort only; ignore quota or serialization errors.
  }
}

/**
 * Conflict resolution: when merging server data with a local snapshot, prefer the local
 * piece if the user last mutated it after the server's update.
 * Returns true when the snapshot has lastMutationAt and it is after serverUpdatedAt (ISO strings).
 */
export function isLocalSnapshotNewerThan(
  snapshot: { lastMutationAt?: string } | null,
  serverUpdatedAt: string
): boolean {
  const local = snapshot?.lastMutationAt;
  if (!local) return false;
  return local > serverUpdatedAt;
}

function buildMutationQueueKey(): string {
  const userId = getClientUserId();
  return `${STORAGE_PREFIX}:mutations:${userId}`;
}

export function enqueueMutation(type: string, payload: unknown): void {
  const ls = safeGetLocalStorage();
  if (!ls) return;
  const key = buildMutationQueueKey();
  const now = new Date().toISOString();
  const entry: QueuedMutation = {
    id: `${now}:${Math.random().toString(36).slice(2)}`,
    type,
    payload,
    createdAt: now,
  };
  try {
    const raw = ls.getItem(key);
    const existing = raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
    existing.push(entry);
    ls.setItem(key, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

export async function flushMutationQueue(
  handler: (mutation: QueuedMutation) => Promise<void>
): Promise<void> {
  const ls = safeGetLocalStorage();
  if (!ls) return;
  const key = buildMutationQueueKey();
  let queue: QueuedMutation[] = [];
  try {
    const raw = ls.getItem(key);
    queue = raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
  } catch {
    queue = [];
  }
  if (!queue.length) return;

  const remaining: QueuedMutation[] = [];
  for (const m of queue) {
    try {
      await handler(m);
    } catch {
      // Keep failed entries for a future retry.
      remaining.push(m);
    }
  }

  try {
    if (remaining.length) {
      ls.setItem(key, JSON.stringify(remaining));
    } else {
      ls.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export function saveUiPreference(key: string, value: string): void {
  const ls = safeGetLocalStorage();
  if (!ls) return;
  try {
    ls.setItem(`${STORAGE_PREFIX}:ui:${key}`, value);
  } catch {
    // ignore
  }
}

export function loadUiPreference(key: string): string | null {
  const ls = safeGetLocalStorage();
  if (!ls) return null;
  try {
    return ls.getItem(`${STORAGE_PREFIX}:ui:${key}`);
  } catch {
    return null;
  }
}

