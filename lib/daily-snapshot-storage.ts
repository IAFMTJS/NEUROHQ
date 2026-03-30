"use client";

import { isSnapshotForToday, getTodayKey } from "@/lib/daily-date";
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

/**
 * Best-effort load of the persisted DailySnapshot.
 * Uses localStorage for now; can be migrated to IndexedDB while keeping the API stable.
 * We never clear the snapshot on navigation; it is only replaced when we have a new
 * same-day snapshot from bootstrap, or when the user clears storage.
 */
export async function loadDailySnapshot(): Promise<DailySnapshot | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isCompatibleSnapshot(parsed)) return null;
    return parsed;
  } catch (err) {
    // Best-effort only; when this fails we fall back to a fresh bootstrap.
    // Logging helps diagnose “snapshot not persisted/used”.
    console.warn("[daily-snapshot] loadDailySnapshot failed", err);
    return null;
  }
}

/** Sync variant for first-paint fallbacks that cannot await. */
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

export async function saveDailySnapshot(snapshot: DailySnapshot): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const now = Date.now();
    const rawSavedAt =
      snapshot.ui && typeof snapshot.ui.savedAt === "number" && Number.isFinite(snapshot.ui.savedAt)
        ? snapshot.ui.savedAt
        : null;
    // `savedAt` must be epoch ms. Older code used `performance.now()` which is a small relative
    // number; treat anything implausibly small as invalid and replace with now.
    const normalizedSavedAt =
      rawSavedAt != null && rawSavedAt > 1_000_000_000_000 ? rawSavedAt : now;
    const normalized: DailySnapshot = {
      ...snapshot,
      version: LATEST_SNAPSHOT_VERSION,
      date: snapshot.date || getTodayKey(),
      ui: {
        ...snapshot.ui,
        savedAt: normalizedSavedAt,
      },
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    try {
      window.dispatchEvent(new CustomEvent("neurohq-daily-snapshot-updated"));
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn("[daily-snapshot] saveDailySnapshot failed", err);
    // Best-effort only; ignore quota/serialization errors.
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
}

/**
 * True when the snapshot matches the local device daily window (see
 * `getSnapshotValidityDayKey` — full calendar day until 00:01 after midnight).
 */
export function isCurrentSnapshot(snapshot: DailySnapshot | null): boolean {
  if (!snapshot) return false;
  return isSnapshotForToday(snapshot);
}

