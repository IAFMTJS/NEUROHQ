import { getBudgetWeekBounds, addDays } from "@/lib/utils/budget-date";

/** Fisher–Yates; optional rng for tests. */
export function shuffleArray<T>(items: T[], rng: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Inclusive dates from max(week Monday, today) through Sunday of the budget week (Mon–Sun).
 */
export function datesFromTodayThroughWeekEnd(todayStr: string): string[] {
  const { start, end } = getBudgetWeekBounds(todayStr);
  const first = todayStr > start ? todayStr : start;
  const out: string[] = [];
  let d = first;
  while (d <= end) {
    out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

/**
 * One due date per protocol task index: willekeurig gespreid over resterende weekdagen.
 */
export function assignProtocolTaskDueDates(taskCount: number, todayStr: string): string[] {
  if (taskCount <= 0) return [];
  let pool = datesFromTodayThroughWeekEnd(todayStr);
  if (pool.length === 0) pool = [todayStr];
  const shuffledDays = shuffleArray(pool);
  const perm = shuffleArray([...Array(taskCount).keys()]);
  const due: string[] = new Array(taskCount);
  for (let i = 0; i < taskCount; i++) {
    const taskIndex = perm[i];
    due[taskIndex] = shuffledDays[i % shuffledDays.length];
  }
  return due;
}
