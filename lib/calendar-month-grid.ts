/** UTC month grid for calendar UI — matches TasksCalendarSection grid math. */

function parseMonthKey(monthParam: string): { y: number; m: number } | null {
  const [monthYear, monthNumber] = monthParam.split("-").map((p) => parseInt(p, 10));
  if (!Number.isFinite(monthYear) || !Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return null;
  }
  return { y: monthYear, m: monthNumber };
}

function toDateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toMonthKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 7);
}

export function resolveCalendarMonthParam(monthParam: string, fallbackDateStr: string): string {
  if (parseMonthKey(monthParam)) return monthParam;
  return fallbackDateStr.slice(0, 7);
}

export function getCalendarMonthLabelNL(monthParam: string, fallbackDateStr: string): string {
  const key = resolveCalendarMonthParam(monthParam, fallbackDateStr);
  const parsed = parseMonthKey(key);
  if (!parsed) return "";
  const monthStart = new Date(Date.UTC(parsed.y, parsed.m - 1, 1, 12));
  return monthStart.toLocaleDateString("nl-NL", { month: "long", year: "numeric", timeZone: "UTC" });
}

export type CalendarGridCell = {
  dateKey: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

export function getCalendarGridCells(
  monthParam: string,
  dateStr: string,
  selectedCalendarDay: string
): CalendarGridCell[] {
  const key = resolveCalendarMonthParam(monthParam, dateStr);
  const parsed = parseMonthKey(key);
  if (!parsed) return [];

  const { y: monthYear, m: monthNumber } = parsed;
  const monthParamResolved = `${monthYear}-${String(monthNumber).padStart(2, "0")}`;
  const monthStart = new Date(Date.UTC(monthYear, monthNumber - 1, 1, 12));
  const monthEnd = new Date(Date.UTC(monthYear, monthNumber, 0, 12));
  const weekStartOffset = monthStart.getUTCDay();
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(monthStart.getUTCDate() - weekStartOffset);
  const gridEnd = new Date(monthEnd);
  const weekEndOffset = 6 - monthEnd.getUTCDay();
  gridEnd.setUTCDate(monthEnd.getUTCDate() + weekEndOffset);

  const days: CalendarGridCell[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const dateKey = toDateKeyUTC(cursor);
    days.push({
      dateKey,
      inCurrentMonth: toMonthKeyUTC(cursor) === monthParamResolved,
      isToday: dateKey === dateStr,
      isSelected: dateKey === selectedCalendarDay,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
