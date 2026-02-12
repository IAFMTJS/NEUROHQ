/** ISO weekday 1=Mon .. 7=Sun */
function getISOWeekday(d: Date): number {
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}

/** Next N occurrence dates for a recurring task (weekly with weekdays, or weekly/monthly simple). */
export function nextRecurrenceDates(
  dueDate: string,
  recurrenceRule: string | null | undefined,
  recurrenceWeekdays: string | null | undefined,
  count: number
): string[] {
  const results: string[] = [];
  if (!recurrenceRule) return results;

  const base = new Date(dueDate + "T12:00:00Z");
  let d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + 1);

  if (recurrenceRule === "daily") {
    for (let i = 0; i < count; i++) {
      results.push(d.toISOString().slice(0, 10));
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return results;
  }

  if (recurrenceRule === "weekly" && recurrenceWeekdays?.trim()) {
    const weekdays = recurrenceWeekdays
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => n >= 1 && n <= 7);
    if (weekdays.length === 0) {
      for (let i = 0; i < count; i++) {
        results.push(d.toISOString().slice(0, 10));
        d.setUTCDate(d.getUTCDate() + 7);
      }
      return results;
    }
    for (let loop = 0; loop < 8 * count; loop++) {
      if (results.length >= count) break;
      const w = getISOWeekday(d);
      if (weekdays.includes(w)) results.push(d.toISOString().slice(0, 10));
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return results;
  }

  if (recurrenceRule === "weekly") {
    for (let i = 0; i < count; i++) {
      results.push(d.toISOString().slice(0, 10));
      d.setUTCDate(d.getUTCDate() + 7);
    }
    return results;
  }

  if (recurrenceRule === "monthly") {
    const dayOfMonth = base.getUTCDate();
    let monthDate = new Date(base.getTime());
    for (let i = 0; i < count; i++) {
      monthDate.setUTCMonth(monthDate.getUTCMonth() + 1);
      if (monthDate.getUTCDate() !== dayOfMonth) monthDate.setUTCDate(0);
      results.push(monthDate.toISOString().slice(0, 10));
    }
    return results;
  }

  return results;
}

/** Format date as short label e.g. "Mon 17 Feb" */
export function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00Z");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}
