/**
 * Budget dates in a fixed timezone (Europe/Amsterdam) so "today" and "current month"
 * match what the user sees, regardless of server (e.g. UTC) time.
 * Fixes entries being saved but not shown because server month != user month.
 */
const BUDGET_TIMEZONE = "Europe/Amsterdam";

/** Today as YYYY-MM-DD in budget timezone */
export function getBudgetToday(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: BUDGET_TIMEZONE });
}

/** Current month start and end (YYYY-MM-DD) in budget timezone */
export function getBudgetMonthBounds(): { monthStart: string; monthEnd: string } {
  const today = getBudgetToday();
  const [y, m] = today.split("-").map(Number);
  const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0));
  const monthEnd = lastDay.toISOString().slice(0, 10);
  return { monthStart, monthEnd };
}

/** Next month and previous month bounds in budget timezone */
export function getBudgetAdjacentMonths(): {
  nextMonthStart: string;
  nextMonthEnd: string;
  prevMonthStart: string;
  prevMonthEnd: string;
} {
  const today = getBudgetToday();
  const [y, m] = today.split("-").map(Number);
  const nextFirst = new Date(Date.UTC(y, m, 1));
  const nextLast = new Date(Date.UTC(y, m + 1, 0));
  const prevFirst = new Date(Date.UTC(y, m - 2, 1));
  const prevLast = new Date(Date.UTC(y, m - 1, 0));
  return {
    nextMonthStart: nextFirst.toISOString().slice(0, 10),
    nextMonthEnd: nextLast.toISOString().slice(0, 10),
    prevMonthStart: prevFirst.toISOString().slice(0, 10),
    prevMonthEnd: prevLast.toISOString().slice(0, 10),
  };
}

/**
 * Next payday date (YYYY-MM-DD) from a given today and day-of-month (1–31).
 * Used for payday-based budget cycle: period runs last_payday_date → day before next payday.
 */
export function getNextPaydayDateFromDay(todayStr: string, dayOfMonth: number): string {
  const d = Math.max(1, Math.min(31, dayOfMonth));
  const [y, m, day] = todayStr.split("-").map(Number);
  const month0 = m - 1;

  if (d > day) {
    const lastDay = new Date(Date.UTC(y, month0 + 1, 0)).getUTCDate();
    const payday = Math.min(d, lastDay);
    return `${y}-${String(m).padStart(2, "0")}-${String(payday).padStart(2, "0")}`;
  }
  const nextMonth = new Date(Date.UTC(y, month0 + 1, 1));
  const nextY = nextMonth.getUTCFullYear();
  const nextM = nextMonth.getUTCMonth() + 1;
  const lastDayNext = new Date(Date.UTC(nextY, nextM, 0)).getUTCDate();
  const payday = Math.min(d, lastDayNext);
  return `${nextY}-${String(nextM).padStart(2, "0")}-${String(payday).padStart(2, "0")}`;
}

/**
 * Previous payday date (YYYY-MM-DD) from a given today and day-of-month (1–31).
 * Used to infer period start when user only set "loondag" but not "vandaag loon gehad".
 */
export function getPreviousPaydayDateFromDay(todayStr: string, dayOfMonth: number): string {
  const d = Math.max(1, Math.min(31, dayOfMonth));
  const [y, m, day] = todayStr.split("-").map(Number);
  const month0 = m - 1;

  if (d <= day) {
    const lastDay = new Date(Date.UTC(y, month0 + 1, 0)).getUTCDate();
    const payday = Math.min(d, lastDay);
    return `${y}-${String(m).padStart(2, "0")}-${String(payday).padStart(2, "0")}`;
  }
  const prevMonth = new Date(Date.UTC(y, month0 - 1, 1));
  const prevY = prevMonth.getUTCFullYear();
  const prevM = prevMonth.getUTCMonth() + 1;
  const lastDayPrev = new Date(Date.UTC(prevY, prevM, 0)).getUTCDate();
  const payday = Math.min(d, lastDayPrev);
  return `${prevY}-${String(prevM).padStart(2, "0")}-${String(payday).padStart(2, "0")}`;
}

/**
 * Budget cycle bounds when user uses payday-based period (last_payday_date set).
 * periodStart = last payday date, periodEnd = day before next payday (inclusive).
 * If today is past periodEnd, returns the *next* period (roll-forward) so the current period is always correct.
 */
export function getBudgetCycleBounds(
  todayStr: string,
  lastPaydayDateStr: string,
  paydayDayOfMonth: number
): { periodStart: string; periodEnd: string } {
  const day = Math.max(1, Math.min(31, paydayDayOfMonth));
  let periodStart = lastPaydayDateStr;
  let nextPayday = getNextPaydayDateFromDay(periodStart, day);
  let next = new Date(nextPayday + "T12:00:00Z");
  next.setUTCDate(next.getUTCDate() - 1);
  let periodEnd = next.toISOString().slice(0, 10);
  const todayDate = new Date(todayStr + "T12:00:00Z");
  const periodEndDate = new Date(periodEnd + "T12:00:00Z");
  while (todayDate.getTime() > periodEndDate.getTime()) {
    periodStart = nextPayday;
    nextPayday = getNextPaydayDateFromDay(periodStart, day);
    next = new Date(nextPayday + "T12:00:00Z");
    next.setUTCDate(next.getUTCDate() - 1);
    periodEnd = next.toISOString().slice(0, 10);
    periodEndDate.setTime(new Date(periodEnd + "T12:00:00Z").getTime());
  }
  return { periodStart, periodEnd };
}

/**
 * Subtract days from a YYYY-MM-DD date string.
 */
export function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Previous payday period bounds: the period that ended the day before periodStart.
 * Used to show "previous period remaining" (e.g. resterend februari).
 */
export function getPreviousPeriodBounds(periodStart: string, paydayDayOfMonth: number): { prevStart: string; prevEnd: string } {
  const day = Math.max(1, Math.min(31, paydayDayOfMonth));
  const prevEnd = subtractDays(periodStart, 1);
  const prevStart = getPreviousPaydayDateFromDay(prevEnd, day);
  return { prevStart, prevEnd };
}

/** Week bounds (Mon–Sun). Uses budget today when no dateStr. */
export function getBudgetWeekBounds(dateStr?: string): { start: string; end: string } {
  const today = dateStr ?? getBudgetToday();
  const d = new Date(today + "T12:00:00Z");
  const dayOfWeek = d.getUTCDay();
  const monOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() + monOffset);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  return {
    start: mon.toISOString().slice(0, 10),
    end: sun.toISOString().slice(0, 10),
  };
}
