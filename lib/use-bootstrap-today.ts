"use client";

import { useQuery } from "@tanstack/react-query";
import {
  bootstrapTodayQueryKey,
  fetchBootstrapTodayFromApi,
  type BootstrapTodayQueryVariant,
} from "@/lib/bootstrap-query";
import type { BootstrapTodayResponse } from "@/lib/daily-snapshot-full-sync";

export type UseBootstrapTodayOptions = {
  /** `core` = slimmere payload (geen budget/learning-DB-work); zelfde cache-seed als `full` na bootstrap. */
  variant?: BootstrapTodayQueryVariant;
};

/**
 * TanStack Query view of `GET /api/bootstrap/today` for a calendar `dateStr` (cache key).
 * Pre-seeded during `BootstrapGate` / `applyBootstrapTodayToApp`; `queryFn` runs when missing or stale.
 */
export function useBootstrapToday(
  dateStr: string | null | undefined,
  options?: UseBootstrapTodayOptions
) {
  const variant = options?.variant ?? "full";
  const key = dateStr?.trim() ?? "";
  return useQuery<BootstrapTodayResponse, Error>({
    queryKey: bootstrapTodayQueryKey(key, variant),
    queryFn: ({ signal }) => fetchBootstrapTodayFromApi(signal, { variant }),
    enabled: key.length > 0,
  });
}
