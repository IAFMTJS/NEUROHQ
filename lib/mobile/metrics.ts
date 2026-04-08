const METRICS_KEY = "neurohq-mobile-sync-metrics-v1";

type SyncMetrics = {
  outboxDepth: number;
  syncSuccessCount: number;
  syncFailureCount: number;
  syncConflictCount: number;
  staleReadCount: number;
  freshReadCount: number;
  updatedAt: number;
  /** Laatste outbox-rij die naar dead_letter ging (voor instellingen-paneel). */
  lastDeadLetterAt: number;
  lastDeadLetterSummary: string | null;
};

const EMPTY_METRICS: SyncMetrics = {
  outboxDepth: 0,
  syncSuccessCount: 0,
  syncFailureCount: 0,
  syncConflictCount: 0,
  staleReadCount: 0,
  freshReadCount: 0,
  updatedAt: 0,
  lastDeadLetterAt: 0,
  lastDeadLetterSummary: null,
};

function readMetrics(): SyncMetrics {
  if (typeof window === "undefined") return { ...EMPTY_METRICS };
  try {
    const raw = window.localStorage.getItem(METRICS_KEY);
    if (!raw) return { ...EMPTY_METRICS };
    const parsed = JSON.parse(raw) as Partial<SyncMetrics>;
    return { ...EMPTY_METRICS, ...parsed };
  } catch {
    return { ...EMPTY_METRICS };
  }
}

function writeMetrics(next: SyncMetrics): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(METRICS_KEY, JSON.stringify(next));
  } catch {
    // ignore best effort
  }
}

function patchMetrics(
  update: Partial<SyncMetrics> | ((current: SyncMetrics) => Partial<SyncMetrics>)
): SyncMetrics {
  const current = readMetrics();
  const patch = typeof update === "function" ? update(current) : update;
  const next: SyncMetrics = { ...current, ...patch, updatedAt: Date.now() };
  writeMetrics(next);
  return next;
}

export function recordOutboxDepth(depth: number): void {
  patchMetrics({ outboxDepth: Math.max(0, depth) });
}

export function recordSyncSuccess(): void {
  patchMetrics((m) => ({ syncSuccessCount: m.syncSuccessCount + 1 }));
}

export function recordSyncFailure(): void {
  patchMetrics((m) => ({ syncFailureCount: m.syncFailureCount + 1 }));
}

export function recordSyncConflict(): void {
  patchMetrics((m) => ({ syncConflictCount: m.syncConflictCount + 1 }));
}

export function recordReadFresh(): void {
  patchMetrics((m) => ({ freshReadCount: m.freshReadCount + 1 }));
}

export function recordReadStale(): void {
  patchMetrics((m) => ({ staleReadCount: m.staleReadCount + 1 }));
}

/** Called when an outbox row hits dead_letter (max retries). */
export function recordDeadLetterHint(action: string, errorPrefix: string): void {
  const summary = `${action}: ${errorPrefix.slice(0, 240)}`;
  patchMetrics({
    lastDeadLetterAt: Date.now(),
    lastDeadLetterSummary: summary,
  });
}

export function getSyncMetrics(): SyncMetrics {
  return readMetrics();
}

let lastPublishAt = 0;

export async function publishSyncMetrics(force = false): Promise<void> {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (!force && now - lastPublishAt < 120_000) return;
  lastPublishAt = now;
  const payload = readMetrics();
  try {
    await fetch("/api/mobile/sync/metrics", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // best effort only
  }
}

