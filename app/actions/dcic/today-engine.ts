"use server";

import type { AppMode } from "@/lib/app-mode";
import { getMode } from "@/app/actions/mode";
import { createClient } from "@/lib/supabase/server";
import { getTodaysTasks } from "@/app/actions/tasks";
import type { TaskListMode } from "@/lib/tasks-actions-shared";
import { getXP } from "@/app/actions/xp";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import {
  DEFAULT_BEHAVIOR_PROFILE,
  type BehaviorProfile,
} from "@/types/behavior-profile.types";
import { getForcedConfrontationForDay, type ForcedConfrontationForDay } from "@/app/actions/confrontation-engine";
import { bucketTodayItems, rawTaskToTodayItem, type BucketedToday, type RawTodayTask } from "@/lib/today-engine";
import { computeBrainMode } from "@/lib/brain-mode";
import { getSuggestedTaskCount } from "@/lib/utils/energy";
import { normalizeStrategyEngineParams, type MissionEngineTuning } from "@/lib/strategy/engine-params";
import { yesterdayDate } from "@/lib/utils/timezone";

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

  const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: dailyRow }, { data: sfRow }, { data: adaptiveEventRows }, quarterSnap] = await Promise.all([
    supabase
      .from("daily_state")
      .select("energy, focus, sensory_load, mental_battery, load, social_load, physical_health, sleep_hours")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .maybeSingle(),
    supabase
      .from("strategy_focus")
      .select("engine_params")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("analytics_events")
      .select("event_name")
      .eq("user_id", user.id)
      .gte("created_at", sinceIso)
      .in("event_name", [
        "mission_started",
        "mission_completed",
        "mission_skipped",
        "mission_deleted",
        "mission_aborted",
      ]),
    import("@/app/actions/quarter-engine-snapshot").then((m) => m.getQuarterEngineSnapshot()),
  ]);

  const missionTuning: MissionEngineTuning | null = sfRow
    ? normalizeStrategyEngineParams((sfRow as { engine_params?: unknown }).engine_params).missions
    : null;

  const ds = dailyRow as {
    energy?: number | null;
    focus?: number | null;
    sensory_load?: number | null;
    social_load?: number | null;
    physical_health?: number | null;
    sleep_hours?: number | null;
  } | null;

  const missionFloorBonus = quarterSnap?.modifiers.extraMissionFloorDelta ?? 0;
  const missionEquivalentCap = ds
    ? getSuggestedTaskCount(
        {
          energy: ds.energy ?? 5,
          focus: ds.focus ?? 5,
          sensory_load: ds.sensory_load ?? 5,
          social_load: ds.social_load ?? 5,
          sleep_hours: ds.sleep_hours ?? null,
          physical_health: ds.physical_health ?? null,
        },
        missionTuning,
        missionFloorBonus
      )
    : undefined;

  const adaptiveCounts = {
    started: 0,
    completed: 0,
    skipped: 0,
    deleted: 0,
    aborted: 0,
  };
  for (const row of adaptiveEventRows ?? []) {
    const eventName = (row as { event_name?: string }).event_name ?? "";
    if (eventName === "mission_started") adaptiveCounts.started += 1;
    else if (eventName === "mission_completed") adaptiveCounts.completed += 1;
    else if (eventName === "mission_skipped") adaptiveCounts.skipped += 1;
    else if (eventName === "mission_deleted") adaptiveCounts.deleted += 1;
    else if (eventName === "mission_aborted") adaptiveCounts.aborted += 1;
  }
  const avoidCount =
    adaptiveCounts.skipped + adaptiveCounts.deleted + adaptiveCounts.aborted;
  const adaptiveDenominator =
    adaptiveCounts.started > 0
      ? adaptiveCounts.started
      : adaptiveCounts.completed + avoidCount;
  const skipDeleteRate =
    adaptiveDenominator > 0 ? avoidCount / adaptiveDenominator : 0;
  const avoidancePressureHigh =
    avoidCount >= 3 || skipDeleteRate >= 0.45;

  const items = (tasks ?? []).map((t, i) => {
    const r = t as {
      id: string;
      title?: string | null;
      energy_required?: number | null;
      impact?: number | null;
      carry_over_count?: number | null;
      category?: string | null;
    };
    const raw: RawTodayTask = {
      id: r.id,
      title: r.title ?? null,
      energy_required: r.energy_required ?? null,
      impact: r.impact ?? null,
      carry_over_count: r.carry_over_count ?? null,
      category: r.category ?? null,
    };
    return rawTaskToTodayItem(raw, i, streakAtRisk);
  });

  const headroom = typeof (dailyRow as { headroom?: number | null } | null)?.headroom === "number"
    ? (dailyRow as { headroom?: number | null }).headroom ?? 0
    : 0;
  const brainMode = computeBrainMode({
    energy: ds?.energy ?? null,
    focus: ds?.focus ?? null,
    sensory_load: ds?.sensory_load ?? null,
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
  const hasNeuroProfile = behaviorProfile.neuroProfileTags.length > 0;
  const allowHeavyByNeuroProfile =
    !hasNeuroProfile || (ds?.sensory_load ?? 5) < 7;
  const allowHeavyByFriction = !avoidancePressureHigh;
  const allowHeavyNow =
    allowHeavyByPattern &&
    allowHeavyByTier &&
    allowHeavyByNeuroProfile &&
    allowHeavyByFriction;
  const missionEquivalentCapAdjusted =
    missionEquivalentCap != null
      ? Math.max(1, missionEquivalentCap - (avoidancePressureHigh ? 1 : 0))
      : undefined;

  const bucketed = bucketTodayItems(items, {
    streakAtRisk,
    nearUnlockSkills: [],
    allowHeavyNow,
    ...(missionEquivalentCapAdjusted != null
      ? { missionEquivalentCap: missionEquivalentCapAdjusted }
      : {}),
  });

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
    physical_health?: number | null;
  } | null;
  behaviorProfile: BehaviorProfile;
  forcedConfrontation: ForcedConfrontationForDay | null;
  minimalIntegrity: {
    active: boolean;
    daysInactive: number;
  } | null;
  /** From active strategy engine; drives suggested task count on client. */
  missionEngine: MissionEngineTuning | null;
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
      missionEngine: null,
    };
  }

  const mode = await getMode(dateStr);
  const taskMode: TaskListMode =
    mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks } = await getTodaysTasks(dateStr, taskMode);

  const yesterdayStr = yesterdayDate(dateStr);
  const [xpRes, streakRow, dailyRow, behaviorProfile, forcedConfrontation, sfRes] = await Promise.all([
    getXP(),
    supabase.from("user_streak").select("last_completion_date").eq("user_id", user.id).single(),
    supabase
      .from("daily_state")
      .select("energy, focus, sensory_load, sleep_hours, social_load, physical_health")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .single(),
    getBehaviorProfile(),
    getForcedConfrontationForDay(dateStr),
    supabase
      .from("strategy_focus")
      .select("engine_params")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle(),
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
    physical_health?: number;
    sleep_hours?: number | null;
  } | null;
  const dailyState = ds
    ? {
        energy: ds.energy ?? 5,
        focus: ds.focus ?? 5,
        sensory_load: ds.sensory_load ?? 5,
        social_load: ds.social_load ?? 5,
        physical_health: ds.physical_health ?? 5,
        sleep_hours: ds.sleep_hours ?? null,
      }
    : null;

  const missionEngine = sfRes.data
    ? normalizeStrategyEngineParams((sfRes.data as { engine_params?: unknown }).engine_params).missions
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
    missionEngine,
  };
}
