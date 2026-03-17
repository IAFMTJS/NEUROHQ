"use client";

import { isSnapshotForToday, getTodayKey } from "@/lib/daily-date";
import {
  LATEST_SNAPSHOT_VERSION,
  type DailySnapshot,
  isCompatibleSnapshot,
} from "@/types/daily-snapshot";

const STORAGE_KEY = "neurohq-daily-snapshot-v1";

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
  } catch {
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
  } catch {
    // Best-effort only; ignore quota/serialization errors.
  }
}

export async function clearDailySnapshot(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Convenience helper to check if a given snapshot is still valid for today.
 */
export function isCurrentSnapshot(snapshot: DailySnapshot | null): boolean {
  if (!snapshot) return false;
  if (!isSnapshotForToday(snapshot)) return false;

  // If we have a savedAt timestamp, treat very old same-day snapshots as stale so
  // the bootstrap loader can rebuild a fresh snapshot (e.g. after many hours or
  // significant server-side changes).
  const maxAgeMs = 12 * 60 * 60 * 1000; // 12h safety window
  const savedAt =
    snapshot.ui && typeof snapshot.ui.savedAt === "number" && Number.isFinite(snapshot.ui.savedAt)
      ? snapshot.ui.savedAt
      : null;
  if (savedAt != null && typeof window !== "undefined") {
    const age = Date.now() - savedAt;
    if (age > maxAgeMs) return false;
  }

  return true;
}

