/**
 * Map calendar quarter ↔ protocol week indices so Strategy can expect
 * “~13 weken × taken per week” i.p.v. alleen de actieve protocolweek.
 */
import { maxWeekIndex, weekForIndex, type ProtocolDefinitionV1 } from "@/lib/growth/protocol-definition";
import { selectProtocolTasksForWeeklyMissions } from "@/lib/growth/protocol-week-mission-tasks";

function utcNoonMs(ymd: string): number {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(5, 7)) - 1;
  const d = Number(ymd.slice(8, 10));
  return Date.UTC(y, m, d, 12, 0, 0, 0);
}

/** Inclusive calendar days between two YYYY-MM-DD strings (UTC date parts). */
export function daysInclusiveUtc(startYmd: string, endYmd: string): number {
  const diff = utcNoonMs(endYmd) - utcNoonMs(startYmd);
  return Math.floor(diff / 86400000) + 1;
}

/** ~Aantal kalenderweken in het kwartaal (plafond dagen/7), minimaal 1. */
export function calendarWeeksOverlappingQuarter(startYmd: string, endYmd: string): number {
  return Math.max(1, Math.ceil(daysInclusiveUtc(startYmd, endYmd) / 7));
}

/**
 * Welke protocolweek lag je ongeveer op `pastDateYmd` als je nu `currentWeekIndex` bent op `referenceTodayYmd`.
 * 1 protocolweek ≈ 1 kalenderweek verschil.
 */
export function estimatedProtocolWeekOnDate(params: {
  referenceTodayYmd: string;
  currentWeekIndex: number;
  pastDateYmd: string;
}): number {
  const diffDays = Math.floor(
    (utcNoonMs(params.referenceTodayYmd) - utcNoonMs(params.pastDateYmd)) / 86400000
  );
  const wholeWeeks = Math.floor(diffDays / 7);
  return Math.max(1, params.currentWeekIndex - wholeWeeks);
}

export function sumExpectedTasksInWeekRange(
  def: ProtocolDefinitionV1,
  weekFrom: number,
  weekTo: number
): number {
  const lo = Math.max(1, weekFrom);
  const hi = Math.min(maxWeekIndex(def), weekTo);
  if (lo > hi) return 0;
  let sum = 0;
  for (let w = lo; w <= hi; w++) {
    const wk = weekForIndex(def, w);
    if (!wk) continue;
    sum += selectProtocolTasksForWeeklyMissions(wk.tasks).length;
  }
  return sum;
}

export function protocolWeekRangeForCalendarQuarter(params: {
  def: ProtocolDefinitionV1;
  quarterStartYmd: string;
  quarterEndYmd: string;
  todayYmd: string;
  currentWeekIndex: number;
}): { weekStart: number; weekEnd: number; expectedTasks: number } {
  const spanWeeks = calendarWeeksOverlappingQuarter(params.quarterStartYmd, params.quarterEndYmd);
  const maxW = maxWeekIndex(params.def);
  const rawStart = estimatedProtocolWeekOnDate({
    referenceTodayYmd: params.todayYmd,
    currentWeekIndex: Math.min(maxW, Math.max(1, params.currentWeekIndex)),
    pastDateYmd: params.quarterStartYmd,
  });
  const weekStart = Math.min(maxW, Math.max(1, rawStart));
  const weekEnd = Math.min(maxW, weekStart + spanWeeks - 1);
  const expectedTasks = sumExpectedTasksInWeekRange(params.def, weekStart, weekEnd);
  return { weekStart, weekEnd, expectedTasks };
}
