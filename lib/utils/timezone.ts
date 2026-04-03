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

/** Weekday in APP_TIMEZONE: 0 = Sunday … 6 = Saturday (matches JS getDay()). */
export function getAppTimezoneWeekday(now: Date = new Date()): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
  }).format(now);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? 0;
}

/** Hour 0–23 in APP_TIMEZONE for the given instant. */
export function getAppTimezoneHour(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = parts.find((p) => p.type === "hour")?.value ?? "0";
  return parseInt(h, 10) || 0;
}

/** Add calendar days to an APP_TIMEZONE YYYY-MM-DD (noon anchor avoids DST edge cases). */
export function addCalendarDaysAmsterdamYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d, 12, 0, 0) + deltaDays * 86400000;
  return new Date(t).toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

/** Monday YYYY-MM-DD in APP_TIMEZONE for the ISO week that contains `todayAmsterdamYmd`. */
export function getAmsterdamIsoWeekMonday(todayAmsterdamYmd: string): string {
  const [y, mo, d] = todayAmsterdamYmd.split("-").map(Number);
  let t = Date.UTC(y, mo - 1, d, 12, 0, 0);
  for (let i = 0; i < 8; i++) {
    const dt = new Date(t);
    if (getAppTimezoneWeekday(dt) === 1) {
      return dt.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
    }
    t -= 86400000;
  }
  return todayAmsterdamYmd;
}

/** Inclusive Monday–Sunday YYYY-MM-DD bounds in APP_TIMEZONE for the week containing today. */
export function getAmsterdamIsoWeekRange(todayAmsterdamYmd: string): { monday: string; sunday: string } {
  const monday = getAmsterdamIsoWeekMonday(todayAmsterdamYmd);
  const sunday = addCalendarDaysAmsterdamYmd(monday, 6);
  return { monday, sunday };
}

function utcCalendarParts(at: Date): { date: string; hour: number; minute: number } {
  return {
    date: at.toISOString().slice(0, 10),
    hour: at.getUTCHours(),
    minute: at.getUTCMinutes(),
  };
}

/**
 * Get current date (YYYY-MM-DD) and hour (0-23) in a given IANA timezone.
 * Invalid `tz` falls back to UTC (same as null timezone in cron).
 */
export function getLocalDateHour(tz: string): { date: string; hour: number } {
  const now = new Date();
  try {
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
  } catch {
    const u = utcCalendarParts(now);
    return { date: u.date, hour: u.hour };
  }
}

/**
 * Get date (YYYY-MM-DD), hour (0-23) and minute (0-59) for a given instant in a timezone.
 * Useful when we need to anchor "start of user's local day" in UTC.
 * Invalid `tz` falls back to UTC calendar clock for `at` (avoids hourly cron 500s).
 */
export function getLocalDateTimeParts(
  tz: string,
  at: Date
): { date: string; hour: number; minute: number } {
  try {
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
  } catch {
    return utcCalendarParts(at);
  }
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
