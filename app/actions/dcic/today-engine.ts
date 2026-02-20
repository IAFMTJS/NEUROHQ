"use server";

import { createClient } from "@/lib/supabase/server";
import { getTodaysTasks, type TaskListMode } from "@/app/actions/tasks";
import { getMode } from "@/app/actions/mode";
import { bucketTodayItems, type BucketedToday, type TodayItem } from "@/lib/today-engine";
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
