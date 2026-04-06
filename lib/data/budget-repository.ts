"use client";

import { getEntityCacheRow, getSyncCheckpoint, upsertEntityCacheRow, upsertSyncCheckpoint } from "@/lib/mobile/db";
import { enqueueOutboxAction } from "@/lib/mobile/outbox";
import { flushOutboxQueue } from "@/lib/mobile/sync-engine";
import { isSupabaseFirstMobileEnabled } from "@/lib/mobile/feature-flags";
import { recordReadFresh, recordReadStale } from "@/lib/mobile/metrics";

export type BudgetContextPayload = {
  periodStart: string;
  periodEnd: string | null;
  periodLabel: string;
  nextPaydayDate: string;
  daysUntilNextIncome: number;
  budgetRemainingCents: number | null;
  disciplineScore: number;
  safeDailySpend: number;
  currency: string;
} | null;

const BUDGET_STALE_MS = 30_000;

function cacheKey(): string {
  return "budget:context";
}

async function fetchBudgetContextFromServer(signal?: AbortSignal): Promise<BudgetContextPayload> {
  try {
    const checkpoint = await getSyncCheckpoint("budget");
    const qs = new URLSearchParams({ domain: "budget" });
    if (checkpoint?.cursor) qs.set("cursor", checkpoint.cursor);
    const res = await fetch(`/api/mobile/sync/pull?${qs.toString()}`, {
      credentials: "include",
      cache: "no-store",
      signal,
    });
    if (!res.ok) throw new Error(`mobile-sync-pull ${res.status}`);
    const json = (await res.json()) as { payload?: BudgetContextPayload; cursor?: string };
    if (json.cursor) {
      await upsertSyncCheckpoint({
        domain: "budget",
        cursor: json.cursor,
        updatedAt: Date.now(),
      });
    }
    return json.payload ?? null;
  } catch {
    const res = await fetch("/api/budget/context", {
      credentials: "include",
      cache: "no-store",
      signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as BudgetContextPayload;
  }
}

export async function getBudgetContextLocalFirst(
  options?: { signal?: AbortSignal; preferCache?: boolean }
): Promise<{ budget: BudgetContextPayload; stale: boolean; source: "cache" | "server" }> {
  if (!isSupabaseFirstMobileEnabled()) {
    const budget = await fetchBudgetContextFromServer(options?.signal);
    return { budget, stale: false, source: "server" };
  }
  const cached = await getEntityCacheRow(cacheKey());
  const now = Date.now();
  const hasCache = cached != null;
  const cacheFresh = hasCache && cached.staleAt > now;
  if (hasCache && (cacheFresh || options?.preferCache)) {
    if (cacheFresh) recordReadFresh();
    else recordReadStale();
    return {
      budget: (cached.payload ?? null) as BudgetContextPayload,
      stale: !cacheFresh,
      source: "cache",
    };
  }
  const budget = await fetchBudgetContextFromServer(options?.signal);
  await upsertEntityCacheRow({
    key: cacheKey(),
    payload: budget,
    etag: null,
    serverVersion: null,
    fetchedAt: now,
    staleAt: now + BUDGET_STALE_MS,
  });
  recordReadFresh();
  return { budget, stale: false, source: "server" };
}

export async function queueBudgetEntryMutation(payload: {
  amount_cents: number;
  date: string;
  category?: string | null;
  note?: string | null;
}): Promise<void> {
  if (!isSupabaseFirstMobileEnabled()) return;
  await enqueueOutboxAction({
    action: "budget.add_entry",
    payload,
  });
  void flushOutboxQueue();
}

