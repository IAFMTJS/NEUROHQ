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

/** Whether current local hour is inside quiet window [start, end). start/end are "HH:MM". Overnight: e.g. "22:00"-"08:00" = quiet when hour >= 22 or hour < 8. */
export function isInQuietHours(localHour: number, start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  const startMin = sH * 60 + (sM || 0);
  const endMin = eH * 60 + (eM || 0);
  const nowMin = localHour * 60;
  if (startMin > endMin) return nowMin >= startMin || nowMin < endMin;
  return nowMin >= startMin && nowMin < endMin;
}
