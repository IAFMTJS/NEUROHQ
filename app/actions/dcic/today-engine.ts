"use server";

import type { AppMode } from "@/lib/app-mode";
import { getMode } from "@/app/actions/mode";
import { createClient } from "@/lib/supabase/server";
import { getTodaysTasks, type TaskListMode } from "@/app/actions/tasks";
import { getXP } from "@/app/actions/xp";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import {
  DEFAULT_BEHAVIOR_PROFILE,
  type BehaviorProfile,
} from "@/types/behavior-profile.types";
import { getForcedConfrontationForDay, type ForcedConfrontationForDay } from "@/app/actions/confrontation-engine";
import { bucketTodayItems, type BucketedToday, type TodayItem, type RawTodayTask } from "@/lib/today-engine";
import { computeBrainMode } from "@/lib/brain-mode";
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

export type TodayEnginePrefetched = {
  tasks: Awaited<ReturnType<typeof getTodaysTasks>>["tasks"];
  carryOverCount: number;
  mode: AppMode;
};

/** Get today's tasks bucketed into Critical / High Impact / Growth Boost. Pass preFetched to avoid duplicate getMode/getTodaysTasks. */
export async function getTodayEngine(
  dateStr: string,
  preFetched?: TodayEnginePrefetched | null
): Promise<TodayEngineResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { bucketed: { critical: [], high_impact: [], growth_boost: [] }, streakAtRisk: false, date: dateStr };
  }

  const behaviorProfile = await getBehaviorProfile();

  let mode: AppMode;
  let tasks: Awaited<ReturnType<typeof getTodaysTasks>>["tasks"];

  if (preFetched?.tasks != null && preFetched.mode != null) {
    mode = preFetched.mode;
    tasks = preFetched.tasks ?? [];
  } else {
    mode = await getMode(dateStr);
    const taskMode: TaskListMode =
      mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
    const result = await getTodaysTasks(dateStr, taskMode);
    tasks = result.tasks ?? [];
  }

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
  const [{ data: dailyRow }] = await Promise.all([
    supabase
      .from("daily_state")
      .select("energy, focus, sensory_load, mental_battery, load")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .maybeSingle(),
  ]);

  const headroom = typeof (dailyRow as { headroom?: number | null } | null)?.headroom === "number"
    ? (dailyRow as { headroom?: number | null }).headroom ?? 0
    : 0;
  const brainMode = computeBrainMode({
    energy: (dailyRow as { energy?: number | null } | null)?.energy ?? null,
    focus: (dailyRow as { focus?: number | null } | null)?.focus ?? null,
    sensory_load: (dailyRow as { sensory_load?: number | null } | null)?.sensory_load ?? null,
    headroom,
    load: (dailyRow as { load?: number | null } | null)?.load ?? null,
    mental_battery: (dailyRow as { mental_battery?: number | null } | null)?.mental_battery ?? null,
  });

  const allowHeavyByPattern = behaviorProfile
    ? behaviorProfile.energyPattern === "evening_crash"
      ? new Date().getHours() < 16
      : behaviorProfile.energyPattern === "morning_low"
        ? new Date().getHours() >= 10
        : true
    : true;
  const allowHeavyByTier = brainMode.tier !== "Low";
  const allowHeavyNow = allowHeavyByPattern && allowHeavyByTier;

  const bucketed = bucketTodayItems(items, { streakAtRisk, nearUnlockSkills: [], allowHeavyNow });

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
  behaviorProfile: BehaviorProfile;
  forcedConfrontation: ForcedConfrontationForDay | null;
  minimalIntegrity: {
    active: boolean;
    daysInactive: number;
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
      behaviorProfile: DEFAULT_BEHAVIOR_PROFILE,
      forcedConfrontation: null,
      minimalIntegrity: null,
    };
  }

  const mode = await getMode(dateStr);
  const taskMode: TaskListMode =
    mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks } = await getTodaysTasks(dateStr, taskMode);

  const yesterdayStr = yesterdayDate(dateStr);
  const [xpRes, streakRow, dailyRow, behaviorProfile, forcedConfrontation] = await Promise.all([
    getXP(),
    supabase.from("user_streak").select("last_completion_date").eq("user_id", user.id).single(),
    supabase
      .from("daily_state")
      .select("energy, focus, sensory_load, sleep_hours, social_load")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .single(),
    getBehaviorProfile(),
    getForcedConfrontationForDay(dateStr),
  ]);

  const lastCompletion =
    (streakRow.data as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;
  const streakAtRisk = lastCompletion !== yesterdayStr && lastCompletion !== dateStr;

  let minimalIntegrity: TodayEngineData["minimalIntegrity"] = null;
  const thresholdRaw = behaviorProfile.minimalIntegrityThresholdDays;
  const threshold =
    typeof thresholdRaw === "number"
      ? Math.min(5, Math.max(2, thresholdRaw))
      : DEFAULT_BEHAVIOR_PROFILE.minimalIntegrityThresholdDays;

  if (!forcedConfrontation && lastCompletion && threshold != null) {
    const last = new Date(lastCompletion);
    const todayLocal = new Date(dateStr + "T12:00:00");
    const diffMs = todayLocal.getTime() - last.getTime();
    const daysInactive = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (daysInactive >= threshold) {
      minimalIntegrity = {
        active: true,
        daysInactive,
      };
    }
  }

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

  const ds = dailyRow.data as {
    energy?: number;
    focus?: number;
    sensory_load?: number;
    social_load?: number;
    sleep_hours?: number | null;
  } | null;
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
    behaviorProfile,
    forcedConfrontation,
    minimalIntegrity,
  };
}
