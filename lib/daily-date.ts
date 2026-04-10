import { getTodayDateStr } from "@/lib/dashboard-cache";
import type { DailySnapshot } from "@/types/daily-snapshot";

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns the canonical \"today\" key (YYYY-MM-DD) used for daily snapshots.
 * Delegates to the same helper as the dashboard cache so behavior is aligned.
 */
export function getTodayKey(): string {
  return getTodayDateStr();
}

/**
 * Yesterday YYYY-MM-DD in local time (for rollover helpers).
 */
export function getYesterdayKey(now: Date = new Date()): string {
  const prev = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return formatLocalYmd(prev);
}

/**
 * Calendar day key used to decide if a {@link DailySnapshot} is still valid.
 *
 * For the bulk of the day (including 23:59:59 local), this equals the device’s
 * local YYYY-MM-DD. After midnight, the boundary is **00:01**: from 00:00:00
 * through 00:00:59 we still treat the snapshot as belonging to **yesterday**,
 * then at 00:01 the new day starts. That keeps the first cold-start bundle for
 * “yesterday” usable through the last second before 00:01.
 */
export function getSnapshotValidityDayKey(now: Date = new Date()): string {
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    return getYesterdayKey(now);
  }
  return formatLocalYmd(now);
}

/**
 * Whether a persisted snapshot is valid for the current local daily window
 * (same calendar day through 23:59:59, then the 00:00–00:00:59 “yesterday” grace
 * described on {@link getSnapshotValidityDayKey}, then 00:01 rolls to the new day).
 */
export function isSnapshotForToday(snapshot: DailySnapshot): boolean {
  const now = new Date();
  const validity = getSnapshotValidityDayKey(now);
  if (snapshot.date === validity) return true;
  // First minute after midnight: server/bootstrap may already stamp "today";
  // accept that while we are still in the grace window.
  const inGrace = now.getHours() === 0 && now.getMinutes() === 0;
  if (inGrace && snapshot.date === formatLocalYmd(now)) return true;
  return false;
}

