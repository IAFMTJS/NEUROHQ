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
  missionsPipeline?: unknown;
};

/** True when bootstrap JSON is not an empty shell (avoids poisoning IDB / silent empty UI). */
export function isBootstrapTodayPayloadUsable(b: BootstrapTodayResponse | null): boolean {
  if (!b || typeof b !== "object") return false;
  if ("error" in b && (b as { error?: unknown }).error != null) return false;
  if (typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}/.test(b.date)) return true;
  if (b.dcicGameState != null && typeof b.dcicGameState === "object") return true;
  if (b.dashboard != null) return true;
  if (b.tasks != null && typeof b.tasks === "object") return true;
  if (Array.isArray(b.completedToday)) return true;
  if (b.dailyState != null && typeof b.dailyState === "object") return true;
  if (b.energyBudget != null && typeof b.energyBudget === "object") return true;
  return false;
}

/**
 * Fetches `/api/bootstrap/today` with a JSON body suitable for cold init.
 * Retries when the server or SW returns 304/empty body (those responses are not parseable as JSON).
 */
export async function fetchBootstrapTodayWithBody(): Promise<
  | { ok: true; status: number; data: BootstrapTodayResponse }
  | { ok: false; status: number; data: null }
> {
  const opts: RequestInit = {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      "x-neurohq-refresh": "1",
      "x-sw-bypass": "1",
      accept: "application/json",
    },
  };

  const bust = () => `/api/bootstrap/today?_nb=${Date.now()}`;

  let res = await fetch("/api/bootstrap/today", opts);
  if (res.status === 304) {
    res = await fetch(bust(), opts);
  }
  if (!res.ok) {
    return { ok: false, status: res.status, data: null };
  }

  let text = await res.text();
  if (!text.trim()) {
    res = await fetch(bust(), opts);
    if (!res.ok) return { ok: false, status: res.status, data: null };
    text = await res.text();
    if (!text.trim()) return { ok: false, status: res.status, data: null };
  }

  try {
    const data = JSON.parse(text) as BootstrapTodayResponse;
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, status: res.status, data: null };
  }
}

let syncDebounce: ReturnType<typeof setTimeout> | null = null;
let mergeBootstrapInFlight: Promise<BootstrapTodayResponse | null> | null = null;

/** Last successful bootstrap ETag (background merge only; enables 304). */
let lastBootstrapEtag: string | null = null;

export function resetBootstrapMergeEtag(): void {
  lastBootstrapEtag = null;
}

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
  if (mergeBootstrapInFlight) return mergeBootstrapInFlight;
  const refreshHeaders = { "x-neurohq-refresh": "1" };
  const run = (async (): Promise<BootstrapTodayResponse | null> => {
    try {
      const headers: Record<string, string> = { ...refreshHeaders };
      if (lastBootstrapEtag) headers["If-None-Match"] = lastBootstrapEtag;
      const res = await fetch("/api/bootstrap/today", {
        credentials: "include",
        cache: "no-store",
        headers,
      });
      if (res.status === 304) return null;
      if (res.status === 401) {
        lastBootstrapEtag = null;
        return null;
      }
      if (!res.ok) return null;
      const nextEtag = res.headers.get("etag");
      if (nextEtag) lastBootstrapEtag = nextEtag;
      return (await res.json()) as BootstrapTodayResponse;
    } catch {
      return null;
    } finally {
      mergeBootstrapInFlight = null;
    }
  })();
  mergeBootstrapInFlight = run;
  return run;
}

/** Apply DCIC game state from the in-memory daily bootstrap snapshot. */
export function getDcicGameStateFromSnapshot(snapshot: DailySnapshot | null): GameState | null {
  const raw = snapshot?.dcicGameState;
  if (!raw || typeof raw !== "object") return null;
  return raw as GameState;
}
