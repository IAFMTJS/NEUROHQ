import type { DashboardCritical, DashboardSecondary } from "@/types/dashboard-data.types";
import type { Task } from "@/types/database.types";

/** Full dashboard pair cached per user + calendar day (see lib/supabase/README.md). */
const DASHBOARD_TTL_MS = 60_000;
/** Short TTL: task lists change often; epoch bump on any user task mutation still clears instantly. */
const TASKS_TTL_MS = 25_000;

type DashboardPair = { critical: DashboardCritical; secondary: DashboardSecondary };

const dashboardEpoch = new Map<string, number>();
const dashboardMem = new Map<string, { epoch: number; at: number; data: DashboardPair }>();

const tasksEpoch = new Map<string, number>();
const tasksMem = new Map<string, { epoch: number; at: number; tasks: Task[] }>();

function dashboardKey(userId: string, dateStr: string) {
  return `${userId}:${dateStr}`;
}

function tasksKey(userId: string, dateStr: string) {
  return `${userId}:${dateStr}`;
}

function verboseLog(message: string, detail?: string) {
  if (process.env.NEUROHQ_VERBOSE_SERVER_LOGS === "1") {
    console.log(`[snapshot-memory-cache] ${message}`, detail ?? "");
  }
}

/** Bump epochs so all in-memory snapshot rows for this user are ignored. */
export function invalidateUserSnapshotMemoryCaches(userId: string): void {
  dashboardEpoch.set(userId, (dashboardEpoch.get(userId) ?? 0) + 1);
  tasksEpoch.set(userId, (tasksEpoch.get(userId) ?? 0) + 1);
  verboseLog("invalidate user", userId.slice(0, 8));
}

export function readDashboardMemoryCache(userId: string, dateStr: string): DashboardPair | null {
  const key = dashboardKey(userId, dateStr);
  const row = dashboardMem.get(key);
  const ep = dashboardEpoch.get(userId) ?? 0;
  if (!row || row.epoch !== ep) return null;
  if (Date.now() - row.at > DASHBOARD_TTL_MS) return null;
  verboseLog("dashboard HIT", key);
  return row.data;
}

export function writeDashboardMemoryCache(userId: string, dateStr: string, data: DashboardPair): void {
  const ep = dashboardEpoch.get(userId) ?? 0;
  dashboardMem.set(dashboardKey(userId, dateStr), { epoch: ep, at: Date.now(), data });
}

export async function loadTasksListWithMemoryCache(
  userId: string,
  date: string,
  fetcher: () => Promise<Task[]>
): Promise<Task[]> {
  const key = tasksKey(userId, date);
  const row = tasksMem.get(key);
  const ep = tasksEpoch.get(userId) ?? 0;
  if (row && row.epoch === ep && Date.now() - row.at <= TASKS_TTL_MS) {
    verboseLog("tasks HIT", key);
    return row.tasks;
  }
  const tasks = await fetcher();
  const epNow = tasksEpoch.get(userId) ?? 0;
  tasksMem.set(key, { epoch: epNow, at: Date.now(), tasks });
  return tasks;
}
