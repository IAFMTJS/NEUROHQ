import { getTodayDateStr } from "@/lib/dashboard-cache";
import type { DailySnapshot } from "@/types/daily-snapshot";

/**
 * Returns the canonical \"today\" key (YYYY-MM-DD) used for daily snapshots.
 * Delegates to the same helper as the dashboard cache so behavior is aligned.
 */
export function getTodayKey(): string {
  return getTodayDateStr();
}

export function isSnapshotForToday(snapshot: DailySnapshot): boolean {
  return snapshot.date === getTodayKey();
}

