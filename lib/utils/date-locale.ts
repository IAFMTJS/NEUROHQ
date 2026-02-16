/**
 * Fixed locale for date/time formatting so server and client render the same output.
 * Prevents hydration mismatches when using toLocaleDateString / toLocaleTimeString.
 */
export const DATE_LOCALE = "en-GB";

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
