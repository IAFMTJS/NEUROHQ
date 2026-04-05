import type { ProtocolTask, ProtocolWeek } from "@/lib/growth/protocol-definition";
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

/** Map YYYY-MM-DD (UTC noon) to protocol day-of-week: 1 = Monday … 7 = Sunday. */
export function dateStrToProtocolDow(dateStr: string): number {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const u = d.getUTCDay();
  return u === 0 ? 7 : u;
}

function buildDowToDatesInPool(pool: string[]): Map<number, string[]> {
  const m = new Map<number, string[]>();
  for (const ds of pool) {
    const dow = dateStrToProtocolDow(ds);
    const arr = m.get(dow) ?? [];
    arr.push(ds);
    m.set(dow, arr);
  }
  return m;
}

/** Union of day_of_week values from week.day_overview rows that list this task id. */
export function collectTaskDayHintsFromWeek(week: ProtocolWeek | undefined): Map<string, number[]> {
  const m = new Map<string, number[]>();
  if (!week?.day_overview?.length) return m;
  for (const row of week.day_overview) {
    for (const tid of row.task_ids ?? []) {
      const prev = m.get(tid) ?? [];
      prev.push(row.day_of_week);
      m.set(tid, prev);
    }
  }
  for (const [k, arr] of m) {
    m.set(k, [...new Set(arr)].sort((a, b) => a - b));
  }
  return m;
}

function pickDateForPreferredDows(
  allowedDows: number[],
  dowToDates: Map<number, string[]>,
  usage: Map<string, number>,
  pool: string[],
): string {
  const candidates: string[] = [];
  for (const dow of allowedDows) {
    candidates.push(...(dowToDates.get(dow) ?? []));
  }
  const usable = candidates.length > 0 ? candidates : pool;
  let best = usable[0]!;
  let bestCount = usage.get(best) ?? 0;
  for (const ds of usable) {
    const c = usage.get(ds) ?? 0;
    if (c < bestCount) {
      bestCount = c;
      best = ds;
    }
  }
  usage.set(best, (usage.get(best) ?? 0) + 1);
  return best;
}

/**
 * One due date per protocol task: respects `week.day_overview` task_ids, then each task's
 * `preferred_days` (1=ma … 7=zo), else falls back to random spread like {@link assignProtocolTaskDueDates}.
 */
export function assignProtocolTaskDueDatesFromWeek(
  tasks: ProtocolTask[],
  week: ProtocolWeek | undefined,
  todayStr: string,
): string[] {
  const n = tasks.length;
  if (n <= 0) return [];
  let pool = datesFromTodayThroughWeekEnd(todayStr);
  if (pool.length === 0) pool = [todayStr];
  const dowToDates = buildDowToDatesInPool(pool);
  const overviewHints = collectTaskDayHintsFromWeek(week);
  const usage = new Map<string, number>();
  const shuffledDays = shuffleArray(pool);
  const perm = shuffleArray([...Array(n).keys()]);
  const due: string[] = new Array(n);

  for (let i = 0; i < n; i++) {
    const taskIndex = perm[i]!;
    const task = tasks[taskIndex]!;
    const fromOv = overviewHints.get(task.id);
    let allowed: number[] | null = null;
    if (fromOv?.length) {
      allowed = fromOv;
    } else if (task.preferred_days?.length) {
      allowed = [...new Set(task.preferred_days)].sort((a, b) => a - b);
    }
    if (allowed && allowed.length > 0) {
      due[taskIndex] = pickDateForPreferredDows(allowed, dowToDates, usage, pool);
    } else {
      due[taskIndex] = shuffledDays[i % shuffledDays.length]!;
    }
  }
  return due;
}

/** One due date per index: random spread (no per-task metadata). */
export function assignProtocolTaskDueDates(taskCount: number, todayStr: string): string[] {
  const tasks: ProtocolTask[] = Array.from({ length: taskCount }, (_, i) => ({
    id: `_anon_${i}`,
    title: "",
    concrete: "",
    minutes: 0,
  }));
  return assignProtocolTaskDueDatesFromWeek(tasks, undefined, todayStr);
}
