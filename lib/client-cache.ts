// Lightweight client-side cache helpers for mutation queues and UI preferences.
// Daily data snapshots are now handled by the centralized DailySnapshot system
// (see lib/daily-snapshot-storage.ts). Per-suffix daily snapshots in this file
// are kept only for backwards compatibility and should be considered deprecated.

const STORAGE_PREFIX = "neurohq";

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

