/**
 * Single source of truth for "today" (YYYY-MM-DD) on the server.
 * Use everywhere: brain status, missions, dashboard, tasks.
 * Uses Europe/Amsterdam so "today" matches budget and Dutch users regardless of server timezone.
 */
const APP_TIMEZONE = "Europe/Amsterdam";

// Re-export canonical week bounds helper so older imports keep working.
import { getWeekBounds as getWeekBoundsFromLearning } from "@/lib/utils/learning";

export function getWeekBounds(date: Date): { start: string; end: string } {
  return getWeekBoundsFromLearning(date);
}

export function todayDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

/**
 * Get current date (YYYY-MM-DD) and hour (0-23) in a given IANA timezone.
 */
export function getLocalDateHour(tz: string): { date: string; hour: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "2025";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  return { date: `${year}-${month}-${day}`, hour };
}

/**
 * Get date (YYYY-MM-DD), hour (0-23) and minute (0-59) for a given instant in a timezone.
 * Useful when we need to anchor "start of user's local day" in UTC.
 */
export function getLocalDateTimeParts(
  tz: string,
  at: Date
): { date: string; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(at);
  const year = parts.find((p) => p.type === "year")?.value ?? "2025";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return { date: `${year}-${month}-${day}`, hour, minute };
}

/**
 * Returns an ISO timestamp for the UTC instant that corresponds to the user's local
 * midnight at the start of `localDateStr` (YYYY-MM-DD) in `tz`.
 *
 * Implementation uses a small search window to avoid relying on Temporal.
 */
export function utcStartOfLocalDayIso(tz: string, localDateStr: string): string {
  // Start searching around 00:00Z of that date; local midnight can be +/- ~14h from UTC.
  const anchor = new Date(localDateStr + "T00:00:00Z");
  // Search in 30-minute steps across 48 hours to cover extreme offsets & DST transitions.
  for (let step = -48; step <= 48; step++) {
    const candidate = new Date(anchor.getTime() + step * 30 * 60 * 1000);
    const parts = getLocalDateTimeParts(tz, candidate);
    if (parts.date === localDateStr && parts.hour === 0 && parts.minute === 0) {
      return candidate.toISOString();
    }
  }
  // Fallback: best-effort anchor (may be wrong near DST, but avoids throwing in cron).
  return anchor.toISOString();
}

/** Get yesterday's date string (YYYY-MM-DD) from a date string. */
export function yesterdayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Get day of year (1-365) for a date string YYYY-MM-DD. */
export function getDayOfYearFromDateString(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new Date(y, 0, 0);
  const end = new Date(y, m - 1, d);
  return Math.ceil((end.getTime() - start.getTime()) / 86400000);
}

/** Whether current local time is inside quiet window [start, end). start/end are "HH:MM". Overnight windows are supported. */
export function isInQuietHours(localHour: number, start: string | null, end: string | null, localMinute = 0): boolean {
  if (!start || !end) return false;
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  const startMin = sH * 60 + (sM || 0);
  const endMin = eH * 60 + (eM || 0);
  const nowMin = localHour * 60 + Math.max(0, Math.min(59, localMinute || 0));
  if (startMin > endMin) return nowMin >= startMin || nowMin < endMin;
  return nowMin >= startMin && nowMin < endMin;
}
