"use client";

import type { QueryClient } from "@tanstack/react-query";
import type { BootstrapTodayResponse } from "@/lib/daily-snapshot-full-sync";

/** Dispatched after bootstrap data is fresh (initial load or background refetch). */
export const NEUROHQ_DAILY_SNAPSHOT_UPDATED = "neurohq-daily-snapshot-updated" as const;

export type NeurohqDailySnapshotUpdatedDetail = {
  savedAt: number;
};

export const BOOTSTRAP_TODAY_QUERY_KEY_ROOT = "bootstrap-today" as const;

export function bootstrapTodayQueryKey(date: string) {
  return [BOOTSTRAP_TODAY_QUERY_KEY_ROOT, date] as const;
}

export function seedBootstrapTodayInCache(
  client: QueryClient | null | undefined,
  date: string,
  data: BootstrapTodayResponse | null | undefined
): void {
  if (!client || !data || !date) return;
  client.setQueryData(bootstrapTodayQueryKey(date), data);
}

/** Network fetch for `useBootstrapToday` (same endpoint as bootstrap step + background refresh). */
export async function fetchBootstrapTodayFromApi(signal?: AbortSignal): Promise<BootstrapTodayResponse> {
  const res = await fetch("/api/bootstrap/today", {
    credentials: "include",
    cache: "no-store",
    headers: { "x-neurohq-refresh": "1" },
    signal,
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Unauthorized" : `bootstrap-today ${res.status}`);
  }
  return (await res.json()) as BootstrapTodayResponse;
}
