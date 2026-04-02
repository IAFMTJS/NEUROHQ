"use client";

import { isSnapshotForToday, getTodayKey } from "@/lib/daily-date";
import {
  clearDeviceDailySnapshot,
  getDeviceDailySnapshotPayload,
  putDeviceDailySnapshotPayload,
} from "@/lib/neurohq-device-idb";
import {
  LATEST_SNAPSHOT_VERSION,
  type DailySnapshot,
  isCompatibleSnapshot,
} from "@/types/daily-snapshot";

const STORAGE_KEY = "neurohq-daily-snapshot-v1";

/**
 * When re-fetching or stepping through bootstrap, prefer non-null slices from
 * either side so a failed request never wipes data that was already loaded for today.
 */
export function mergeSnapshotKeepBest(
  today: string,
  older: DailySnapshot | null,
  newer: DailySnapshot
): DailySnapshot {
  if (!older || older.date !== today) {
    return { ...newer, version: LATEST_SNAPSHOT_VERSION, date: today };
  }
  const pages = [
    ...(older.ui?.pagesPrefetched ?? []),
    ...(newer.ui?.pagesPrefetched ?? []),
  ];
  return {
    ...newer,
    version: LATEST_SNAPSHOT_VERSION,
    date: today,
    dashboard: newer.dashboard ?? older.dashboard,
    missions: newer.missions ?? older.missions,
    xp: newer.xp ?? older.xp,
    strategy: newer.strategy ?? older.strategy,
    learning: newer.learning ?? older.learning,
    budget: newer.budget ?? older.budget,
    analytics: newer.analytics ?? older.analytics,
    settings: newer.settings ?? older.settings ?? null,
    dcicGameState: newer.dcicGameState ?? older.dcicGameState,
    ui: {
      ...older.ui,
      ...newer.ui,
      pagesPrefetched: [...new Set(pages)],
      assetsPrefetched: Boolean(newer.ui?.assetsPrefetched || older.ui?.assetsPrefetched),
      offlineMode: newer.ui?.offlineMode ?? older.ui?.offlineMode,
      savedAt: newer.ui?.savedAt ?? older.ui?.savedAt,
    },
  };
}

function parseSnapshotRaw(raw: string | null): DailySnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isCompatibleSnapshot(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Load order: localStorage (fast), then IndexedDB PWA mirror (same payload bytes).
 * When recovered from IDB, best-effort repopulates localStorage.
 */
export async function loadDailySnapshot(): Promise<DailySnapshot | null> {
  if (typeof window === "undefined") return null;
  try {
    const fromLs = parseSnapshotRaw(window.localStorage.getItem(STORAGE_KEY));
    if (fromLs) return fromLs;
  } catch (err) {
    console.warn("[daily-snapshot] loadDailySnapshot localStorage failed", err);
  }

  try {
    const rawIdb = await getDeviceDailySnapshotPayload();
    const fromIdb = parseSnapshotRaw(rawIdb);
    if (fromIdb && rawIdb) {
      try {
        window.localStorage.setItem(STORAGE_KEY, rawIdb);
      } catch {
        // Quota or private mode — keep in-memory use until next successful save.
      }
      try {
        window.dispatchEvent(new CustomEvent("neurohq-daily-snapshot-updated"));
      } catch {
        // ignore
      }
      return fromIdb;
    }
  } catch (err) {
    console.warn("[daily-snapshot] loadDailySnapshot idb failed", err);
  }
  return null;
}

/** Sync variant for first-paint fallbacks — localStorage only (IndexedDB requires async `loadDailySnapshot`). */
export function loadDailySnapshotSync(): DailySnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isCompatibleSnapshot(parsed)) return null;
    return parsed;
  } catch (err) {
    console.warn("[daily-snapshot] loadDailySnapshotSync failed", err);
    return null;
  }
}

export type SaveDailySnapshotResult =
  | { ok: true; verified: true }
  | { ok: false; error: string };

function buildNormalizedSnapshotForStorage(snapshot: DailySnapshot): DailySnapshot {
  const now = Date.now();
  const rawSavedAt =
    snapshot.ui && typeof snapshot.ui.savedAt === "number" && Number.isFinite(snapshot.ui.savedAt)
      ? snapshot.ui.savedAt
      : null;
  const normalizedSavedAt =
    rawSavedAt != null && rawSavedAt > 1_000_000_000_000 ? rawSavedAt : now;
  return {
    ...snapshot,
    version: LATEST_SNAPSHOT_VERSION,
    date: snapshot.date || getTodayKey(),
    ui: {
      ...snapshot.ui,
      savedAt: normalizedSavedAt,
    },
  };
}

/**
 * Writes the snapshot and verifies storage with a byte-identical read-back of the same payload.
 */
export async function saveDailySnapshot(snapshot: DailySnapshot): Promise<SaveDailySnapshotResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "no-window" };
  }
  try {
    const normalized = buildNormalizedSnapshotForStorage(snapshot);
    let payload: string;
    try {
      payload = JSON.stringify(normalized);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "stringify failed" };
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, payload);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "setItem failed" };
    }
    const readBack = window.localStorage.getItem(STORAGE_KEY);
    if (readBack !== payload) {
      return {
        ok: false,
        error: readBack == null ? "read-back missing" : "read-back mismatch",
      };
    }
    try {
      await putDeviceDailySnapshotPayload(payload);
    } catch (e) {
      console.warn("[daily-snapshot] IndexedDB mirror failed (localStorage verified ok)", e);
    }
    try {
      window.dispatchEvent(new CustomEvent("neurohq-daily-snapshot-updated"));
    } catch {
      // ignore
    }
    return { ok: true, verified: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[daily-snapshot] saveDailySnapshot failed", err);
    return { ok: false, error: msg };
  }
}

const DEFAULT_SAVE_RETRIES = 4;
const DEFAULT_SAVE_RETRY_DELAY_MS = 100;

/** Retries with linear backoff (delay * attempt index) after failed or unverified writes. */
export async function saveDailySnapshotWithRetries(
  snapshot: DailySnapshot,
  opts?: { maxAttempts?: number; delayMs?: number }
): Promise<SaveDailySnapshotResult> {
  const maxAttempts = Math.max(1, opts?.maxAttempts ?? DEFAULT_SAVE_RETRIES);
  const delayMs = opts?.delayMs ?? DEFAULT_SAVE_RETRY_DELAY_MS;
  let last: SaveDailySnapshotResult = { ok: false, error: "no attempt" };
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, delayMs * i));
    }
    last = await saveDailySnapshot(snapshot);
    if (last.ok) return last;
  }
  console.error("[daily-snapshot] saveDailySnapshotWithRetries exhausted", last.error);
  return last;
}

/** ~92% of estimated quota — snapshot writes may start failing under pressure. */
const STORAGE_PRESSURE_RATIO = 0.92;

/**
 * Best-effort quota hint from the Storage API (not available in all browsers / contexts).
 */
export async function getStoragePressureFlag(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  try {
    const est = await navigator.storage?.estimate?.();
    if (!est?.quota || est.quota <= 0) return false;
    const usage = typeof est.usage === "number" ? est.usage : 0;
    return usage / est.quota >= STORAGE_PRESSURE_RATIO;
  } catch {
    return false;
  }
}

export async function clearDailySnapshot(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[daily-snapshot] clearDailySnapshot failed", err);
    // ignore
  }
  try {
    await clearDeviceDailySnapshot();
  } catch (err) {
    console.warn("[daily-snapshot] clearDeviceDailySnapshot failed", err);
  }
}

/**
 * True when the snapshot matches the local device daily window (see
 * `getSnapshotValidityDayKey` — full calendar day until 00:01 after midnight).
 */
export function isCurrentSnapshot(snapshot: DailySnapshot | null): boolean {
  if (!snapshot) return false;
  return isSnapshotForToday(snapshot);
}

