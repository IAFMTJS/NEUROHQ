"use client";

/**
 * Background refresh: refetch `/api/bootstrap/today` and return JSON for HQ store alignment.
 * Used after pending writes, periodically, and on focus/visibility (see `daily-bootstrap.ts`).
 */

import type { DailySnapshot } from "@/types/daily-snapshot";
import type { GameState } from "@/lib/dcic/types";

export type BootstrapTodayResponse = {
  date?: string;
  dashboard?: { critical?: unknown; secondary?: unknown } | null;
  dcicGameState?: unknown;
  tasks?: Record<string, unknown[]>;
  completedToday?: unknown[];
  dailyState?: Record<string, unknown> | null;
  energyBudget?: Record<string, unknown> | null;
  budget?: Record<string, unknown> | null;
  learning?: unknown;
};

let syncDebounce: ReturnType<typeof setTimeout> | null = null;

/** Debounced bootstrap refetch (e.g. after local pending writes). */
export function scheduleSyncDailySnapshot(delayMs = 1400): void {
  if (typeof window === "undefined") return;
  if (syncDebounce) clearTimeout(syncDebounce);
  syncDebounce = setTimeout(() => {
    syncDebounce = null;
    void mergeDailySnapshotFromNetwork();
  }, delayMs);
}

export async function mergeDailySnapshotFromNetwork(): Promise<BootstrapTodayResponse | null> {
  if (typeof window === "undefined") return null;
  const refreshHeaders = { "x-neurohq-refresh": "1" };
  try {
    const res = await fetch("/api/bootstrap/today", {
      credentials: "include",
      headers: refreshHeaders,
    });
    if (!res.ok) return null;
    return (await res.json()) as BootstrapTodayResponse;
  } catch {
    return null;
  }
}

/** Apply DCIC game state from the in-memory daily bootstrap snapshot. */
export function getDcicGameStateFromSnapshot(snapshot: DailySnapshot | null): GameState | null {
  const raw = snapshot?.dcicGameState;
  if (!raw || typeof raw !== "object") return null;
  return raw as GameState;
}
