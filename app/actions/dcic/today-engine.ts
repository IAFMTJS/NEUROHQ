"use server";

import { createClient } from "@/lib/supabase/server";
import { getTodaysTasks, type TaskListMode } from "@/app/actions/tasks";
import { getMode } from "@/app/actions/mode";
import { getXP } from "@/app/actions/xp";
import { bucketTodayItems, type BucketedToday, type TodayItem, type RawTodayTask } from "@/lib/today-engine";
import { yesterdayDate } from "@/lib/utils/timezone";

const DEFAULT_ENERGY = 2;
const DEFAULT_XP = 50;

/** Map task row to TodayItem (energy 1–5, base XP from impact or default). */
function taskToTodayItem(t: {
  id: string;
  title?: string | null;
  energy_required?: number | null;
  impact?: number | null;
  carry_over_count?: number | null;
  category?: string | null;
}): TodayItem {
  const energy = Math.min(5, Math.max(1, (t.energy_required as number) ?? DEFAULT_ENERGY));
  const xp = Math.max(10, Math.min(100, ((t.impact as number) ?? 5) * 15)) || DEFAULT_XP;
  return {
    id: t.id,
    title: t.title ?? "Task",
    energyCost: energy,
    xpReward: xp,
    carryOverCount: (t.carry_over_count as number) ?? 0,
    category: t.category ?? null,
  };
}

export interface TodayEngineResult {
  bucketed: BucketedToday;
  streakAtRisk: boolean;
  date: string;
}

/** Get today's tasks bucketed into Critical / High Impact / Growth Boost. */
export async function getTodayEngine(dateStr: string): Promise<TodayEngineResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { bucketed: { critical: [], high_impact: [], growth_boost: [] }, streakAtRisk: false, date: dateStr };
  }

  const mode = await getMode(dateStr);
  const taskMode: TaskListMode =
    mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks } = await getTodaysTasks(dateStr, taskMode);

  const yesterdayStr = yesterdayDate(dateStr);
  const { data: streakRow } = await supabase
    .from("user_streak")
    .select("last_completion_date")
    .eq("user_id", user.id)
    .single();
  const lastCompletion = (streakRow as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;
  const streakAtRisk = lastCompletion !== yesterdayStr && lastCompletion !== dateStr;

  const items: TodayItem[] = (tasks ?? []).map((t, i) => {
    const item = taskToTodayItem(t as Parameters<typeof taskToTodayItem>[0]);
    if (streakAtRisk && i < 2) item.streakCritical = true;
    return item;
  });

  const bucketed = bucketTodayItems(items, { streakAtRisk, nearUnlockSkills: [] });

  return { bucketed, streakAtRisk, date: dateStr };
}

/** Raw data for client-side engine: no bucketing, no suggestion. Client runs lib/today-engine locally. */
export interface TodayEngineData {
  tasks: RawTodayTask[];
  streakAtRisk: boolean;
  mode: string;
  date: string;
  xp: { total_xp: number };
  dailyState: {
    energy: number;
    focus: number;
    sensory_load: number;
    social_load: number;
    sleep_hours: number | null;
  } | null;
}

export async function getTodayEngineData(dateStr: string): Promise<TodayEngineData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      tasks: [],
      streakAtRisk: false,
      mode: "normal",
      date: dateStr,
      xp: { total_xp: 0 },
      dailyState: null,
    };
  }

  const mode = await getMode(dateStr);
  const taskMode: TaskListMode =
    mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks } = await getTodaysTasks(dateStr, taskMode);

  const yesterdayStr = yesterdayDate(dateStr);
  const [xpRes, streakRow, dailyRow] = await Promise.all([
    getXP(),
    supabase.from("user_streak").select("last_completion_date").eq("user_id", user.id).single(),
    supabase.from("daily_state").select("energy, focus, sensory_load, sleep_hours, social_load").eq("user_id", user.id).eq("date", dateStr).single(),
  ]);

  const lastCompletion = (streakRow.data as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;
  const streakAtRisk = lastCompletion !== yesterdayStr && lastCompletion !== dateStr;

  const rawTasks: RawTodayTask[] = (tasks ?? []).map((t) => {
    const r = t as { id: string; title?: string | null; energy_required?: number | null; impact?: number | null; carry_over_count?: number | null; category?: string | null };
    return {
      id: r.id,
      title: r.title ?? null,
      energy_required: r.energy_required ?? null,
      impact: r.impact ?? null,
      carry_over_count: r.carry_over_count ?? null,
      category: r.category ?? null,
    };
  });

  const ds = dailyRow.data as { energy?: number; focus?: number; sensory_load?: number; social_load?: number; sleep_hours?: number | null } | null;
  const dailyState = ds
    ? {
        energy: ds.energy ?? 5,
        focus: ds.focus ?? 5,
        sensory_load: ds.sensory_load ?? 5,
        social_load: ds.social_load ?? 5,
        sleep_hours: ds.sleep_hours ?? null,
      }
    : null;

  return {
    tasks: rawTasks,
    streakAtRisk,
    mode: mode ?? "normal",
    date: dateStr,
    xp: { total_xp: xpRes.total_xp },
    dailyState,
  };
}
