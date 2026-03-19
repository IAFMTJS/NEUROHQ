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
 * Matches the device local date for most of the day, but the boundary after
 * midnight is **00:01**: from 00:00:00 through 00:00:59 we still treat the
 * snapshot as belonging to **yesterday**, then at 00:01 the new day starts.
 * This matches a full reload/discarded snapshot only after 00:01 local.
 */
export function getSnapshotValidityDayKey(now: Date = new Date()): string {
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    return getYesterdayKey(now);
  }
  return formatLocalYmd(now);
}

/**
 * Whether a persisted snapshot is valid for the current local daily window
 * (entire calendar day until the next 00:01 rollover).
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

