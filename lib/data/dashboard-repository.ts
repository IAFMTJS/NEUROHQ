"use client";

import { getEntityCacheRow, getSyncCheckpoint, upsertEntityCacheRow, upsertSyncCheckpoint } from "@/lib/mobile/db";
import { isSupabaseFirstMobileEnabled } from "@/lib/mobile/feature-flags";
import { recordReadFresh, recordReadStale } from "@/lib/mobile/metrics";

type DashboardPayload = {
  critical: Record<string, unknown>;
  secondary: Record<string, unknown>;
} | null;

const DASHBOARD_STALE_MS = 20_000;

const CACHE_KEY = "dashboard:all";

async function fetchDashboardAllFromServer(signal?: AbortSignal): Promise<DashboardPayload> {
  const checkpoint = await getSyncCheckpoint("dashboard");
  const qs = new URLSearchParams({ domain: "dashboard" });
  if (checkpoint?.cursor) qs.set("cursor", checkpoint.cursor);
  const res = await fetch(`/api/mobile/sync/pull?${qs.toString()}`, {
    credentials: "include",
    cache: "no-store",
    signal,
    headers: { "x-neurohq-refresh": "1" },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { payload?: DashboardPayload; cursor?: string };
  if (json.cursor) {
    await upsertSyncCheckpoint({
      domain: "dashboard",
      cursor: json.cursor,
      updatedAt: Date.now(),
    });
  }
  return json.payload ?? null;
}

export async function getDashboardPayloadLocalFirst(
  options?: { signal?: AbortSignal; preferCache?: boolean }
): Promise<{ payload: DashboardPayload; stale: boolean; source: "cache" | "server" }> {
  if (!isSupabaseFirstMobileEnabled()) {
    const payload = await fetchDashboardAllFromServer(options?.signal);
    return { payload, stale: false, source: "server" };
  }
  const now = Date.now();
  const cached = await getEntityCacheRow(CACHE_KEY);
  const hasCache = cached != null;
  const cacheFresh = hasCache && cached.staleAt > now;
  if (hasCache && (cacheFresh || options?.preferCache)) {
    if (cacheFresh) recordReadFresh();
    else recordReadStale();
    return {
      payload: (cached.payload ?? null) as DashboardPayload,
      stale: !cacheFresh,
      source: "cache",
    };
  }
  const payload = await fetchDashboardAllFromServer(options?.signal);
  await upsertEntityCacheRow({
    key: CACHE_KEY,
    payload,
    etag: null,
    serverVersion: null,
    fetchedAt: now,
    staleAt: now + DASHBOARD_STALE_MS,
  });
  recordReadFresh();
  return { payload, stale: false, source: "server" };
}

