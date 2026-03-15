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
    const normalized: DailySnapshot = {
      ...snapshot,
      version: LATEST_SNAPSHOT_VERSION,
      date: snapshot.date || getTodayKey(),
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
  return isSnapshotForToday(snapshot);
}

