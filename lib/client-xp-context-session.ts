"use client";

import { getTodayKey } from "@/lib/daily-date";

const SESSION_KEY = "neurohq-xp-context-network-v1";

/**
 * In-app navigation: skip redundant `/api/xp/context` calls when we already seeded from
 * DailySnapshot + IndexedDB (`neurohq-xp-cache`) for the same calendar day.
 *
 * PWA cold start clears sessionStorage → one network revalidation per launch is still allowed;
 * the persisted day bundle itself lives in IndexedDB until the calendar day rolls over.
 */
export function xpContextNetworkAlreadyDoneForToday(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === getTodayKey();
  } catch {
    return false;
  }
}

export function markXpContextNetworkDoneForToday(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, getTodayKey());
  } catch {
    /* private mode */
  }
}
