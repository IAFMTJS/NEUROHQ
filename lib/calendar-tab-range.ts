/** Task query range for the calendar month grid (prev/next month bleed), UTC keys — matches TasksCalendarAsync. */

function toDateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getCalendarTaskRangeForMonth(monthParam: string): { rangeStart: string; rangeEnd: string } {
  const [monthYear, monthNumber] = monthParam.split("-").map((p) => parseInt(p, 10));
  if (!Number.isFinite(monthYear) || !Number.isFinite(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    const fallback = new Date();
    const y = fallback.getUTCFullYear();
    const m = fallback.getUTCMonth() + 1;
    return getCalendarTaskRangeForMonth(`${y}-${String(m).padStart(2, "0")}`);
  }

  const monthStart = new Date(Date.UTC(monthYear, monthNumber - 1, 1, 12));
  const weekStartOffset = monthStart.getUTCDay();
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(monthStart.getUTCDate() - weekStartOffset);
  const nextMonthEnd = new Date(Date.UTC(monthYear, monthNumber + 1, 0, 12));
  const nextWeekEnd = 6 - nextMonthEnd.getUTCDay();
  const nextGridEnd = new Date(nextMonthEnd);
  nextGridEnd.setUTCDate(nextMonthEnd.getUTCDate() + nextWeekEnd);
  const prevMonthStart = new Date(Date.UTC(monthYear, monthNumber - 2, 1, 12));
  const prevWeekStart = prevMonthStart.getUTCDay();
  const prevGridStart = new Date(prevMonthStart);
  prevGridStart.setUTCDate(prevMonthStart.getUTCDate() - prevWeekStart);

  return {
    rangeStart: toDateKeyUTC(prevGridStart),
    rangeEnd: toDateKeyUTC(nextGridEnd),
  };
}
