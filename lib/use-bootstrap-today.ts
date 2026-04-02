"use client";

import { useQuery } from "@tanstack/react-query";
import {
  bootstrapTodayQueryKey,
  fetchBootstrapTodayFromApi,
} from "@/lib/bootstrap-query";
import type { BootstrapTodayResponse } from "@/lib/daily-snapshot-full-sync";

/**
 * TanStack Query view of `GET /api/bootstrap/today` for a calendar `dateStr` (cache key).
 * Pre-seeded during `BootstrapGate` / `applyBootstrapTodayToApp`; `queryFn` runs when missing or stale.
 */
export function useBootstrapToday(dateStr: string | null | undefined) {
  const key = dateStr?.trim() ?? "";
  return useQuery<BootstrapTodayResponse, Error>({
    queryKey: bootstrapTodayQueryKey(key),
    queryFn: ({ signal }) => fetchBootstrapTodayFromApi(signal),
    enabled: key.length > 0,
  });
}
