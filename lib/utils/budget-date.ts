/**
 * Budget dates: "today" and month bounds in a fixed timezone so they match
 * what the user sees. Uses the same "today" as the rest of the app (see timezone.ts).
 */
import { todayDateString } from "@/lib/utils/timezone";

/** Today as YYYY-MM-DD (same as app: Europe/Amsterdam). */
export function getBudgetToday(): string {
  return todayDateString();
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
 * Next payday date (YYYY-MM-DD): next calendar occurrence of day-of-month (e.g. next 8th).
 * Used when inferring from "today" (no last_payday_date set).
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
 * Next payday as the given day-of-month in the month *after* the reference date.
 * Used when last_payday_date is set: period is "from last payday until ~1 month later" (e.g. 5 Mar → 8 Apr), not "until next calendar 8th" (5 Mar → 8 Mar).
 */
export function getNextPaydayDateNextMonth(referenceDateStr: string, dayOfMonth: number): string {
  const d = Math.max(1, Math.min(31, dayOfMonth));
  const [y, m] = referenceDateStr.split("-").map(Number);
  const month0 = m - 1;
  const nextMonth0 = (month0 + 1) % 12;
  const nextY = month0 === 11 ? y + 1 : y;
  const nextM = nextMonth0 + 1; // 1-based for output
  const lastDayNext = new Date(Date.UTC(nextY, nextMonth0 + 1, 0)).getUTCDate();
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
 * Next payday is the 8th (etc.) of the *next* month (~30 days), not the next calendar 8th.
 * We do not roll forward: the period end stays fixed until the user pushes "Vandaag loon gehad".
 */
export function getBudgetCycleBounds(
  _todayStr: string,
  lastPaydayDateStr: string,
  paydayDayOfMonth: number
): { periodStart: string; periodEnd: string } {
  const day = Math.max(1, Math.min(31, paydayDayOfMonth));
  const periodStart = lastPaydayDateStr;
  const nextPayday = getNextPaydayDateNextMonth(periodStart, day);
  const next = new Date(nextPayday + "T12:00:00Z");
  next.setUTCDate(next.getUTCDate() - 1);
  const periodEnd = next.toISOString().slice(0, 10);
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
