/**
 * Fixed locale for date/time formatting so server and client render the same output.
 * Prevents hydration mismatches when using toLocaleDateString / toLocaleTimeString.
 */
export const DATE_LOCALE = "en-GB";

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatMonthYearShort(year: number, month1to12: number): string {
  const idx = month1to12 - 1;
  if (idx < 0 || idx > 11) return "Invalid month";
  return `${MONTHS_SHORT[idx]} ${year}`;
}

/**
 * Format YYYY-MM-DD as "Thu 19 Feb" (no comma). Uses UTC so server and client match.
 */
export function formatDayShort(dateKey: string): string {
  const d = new Date(dateKey + "T12:00:00Z");
  const w = WEEKDAYS_SHORT[d.getUTCDay()];
  const day = d.getUTCDate();
  const m = MONTHS_SHORT[d.getUTCMonth()];
  return `${w} ${day} ${m}`;
}

/**
 * Format an ISO date-time string as "HH:MM:SS" in a deterministic way.
 * Prefer slicing (no locale/timezone dependence); fall back to Intl if needed.
 */
export function formatIsoTimeHms(isoDateTime: string): string {
  // Common shapes: 2026-02-18T09:00:00.000Z, 2026-02-18T09:00:00Z, 2026-02-18T09:00:00+01:00
  if (isoDateTime.length >= 19 && isoDateTime[10] === "T") {
    return isoDateTime.slice(11, 19);
  }
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return "Invalid time";
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  })
    .format(d)
    .replace(".", ":");
}
