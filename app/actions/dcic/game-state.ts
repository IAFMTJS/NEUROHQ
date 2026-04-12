/**
 * Dark Commander Intelligence Core - Game State Server Actions
 * CRUD operations for gameState
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  todayDateString,
  yesterdayDate,
  getAppTimezoneHour,
  getAppTimezoneWeekday,
  getAmsterdamIsoWeekRange,
} from "@/lib/utils/timezone";
import type { GameState, Mission } from "@/lib/dcic/types";
import { applyBrainLayerToGameState } from "@/lib/dcic/brain-game-state";
import { countWarTierDays, type DailyRowForBrain } from "@/lib/dcic/brain-status-average";
import { analyticsBrainToDailyRowForBrain } from "@/lib/user-analytics-brain-snapshot";
import { autoModeCheck, isModeLocked, passiveRecoveryTick, switchMode } from "@/lib/dcic/mode-engine";
import {
  isOverdriveActivationTimeAllowed,
  maybeAutoTriggerOverdrive,
  pickWeeklySlotWeekdays,
} from "@/lib/dcic/overdrive-auto";
import { updateDifficulty, generateDailyMissions } from "@/lib/dcic/difficulty-engine";
import { rankFromLevel } from "@/lib/rank-ladder";
import { levelFromTotalXP, xpToNextLevel as xpRemainingToNextLevel } from "@/lib/xp";
import { sendOverdriveActivatedPushIfEnabled } from "@/lib/push";

const DCIC_MODE_VALUES: GameState["mode"]["current"][] = [
  "focus",
  "war",
  "recovery",
  "overdrive",
];

function parseLockedDcicMode(raw: unknown): GameState["mode"]["current"] | null {
  if (typeof raw !== "string") return null;
  return DCIC_MODE_VALUES.includes(raw as GameState["mode"]["current"])
    ? (raw as GameState["mode"]["current"])
    : null;
}

/** Brain check-in circles in daily_state are 1–10; gameState.stats use 0–100 for mode-engine / passive ticks. */
function dailyBrainCircleToStat100(v: unknown, fallback: number): number {
  if (v == null) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  if (n > 10) return Math.min(100, Math.round(n));
  return Math.round((n / 10) * 100);
}

/** Inverse of dailyBrainCircleToStat100 — required before persisting stats to daily_state (1–10 check). */
function stat100ToDailyBrainCircle(n: number): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 5;
  const scaled = Math.round((Math.min(100, Math.max(0, x)) / 100) * 10);
  return Math.min(10, Math.max(1, scaled));
}

type GetGameStateOptions = {
  includeFinance?: boolean;
};

/**
 * Gets current gameState from database.
 * By default includes finance state; pass includeFinance: false for lean reads.
 */
export async function getGameState(
  options: GetGameStateOptions = {}
): Promise<GameState | null> {
  const { includeFinance = true } = options;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch all core game data in parallel to avoid a slow waterfall.
  // Must match daily_state.date (saveDailyState, dashboard) — not UTC calendar day.
  const today = todayDateString();
  const { monday: amsterdamIsoWeekMonday, sunday: amsterdamIsoWeekSunday } =
    getAmsterdamIsoWeekRange(today);

  const MISSIONS_SELECT =
    "id, name, xp_reward, energy_cost, completed, active, started_at, completed_at, difficulty_level, focus_requirement, social_intensity, mission_type, category, skill_link, recurrence_type, streak_eligible, mission_intent, expires_at, created_at";
  const weekStart = new Date(today + "T12:00:00Z");
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const [
    { data: xpData },
    { data: missionsData },
    { data: streakData },
    { data: achievementsData },
    { data: skillsData },
    { data: dailyState },
    { data: brainWeekAnalytics },
    { count: weeklySlotHistoryCount },
  ] = await Promise.all([
    supabase.from("user_xp").select("total_xp").eq("user_id", user.id).single(),
    supabase
      .from("missions")
      .select(MISSIONS_SELECT)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("user_streak")
      .select("current_streak, longest_streak, last_completion_date")
      .eq("user_id", user.id)
      .single(),
    supabase.from("achievements").select("achievement_key").eq("user_id", user.id),
    supabase.from("user_skills").select("skill_key").eq("user_id", user.id),
    supabase
      .from("daily_state")
      .select(
        "energy, focus, sensory_load, load, mental_battery, physical_health, sleep_hours, dcic_mode, dcic_locked_until, dcic_overdrive_session_start, dcic_overdrive_auto_triggered, dcic_overdrive_trigger_reason, dcic_overdrive_triggered_at"
      )
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("user_analytics_daily")
      .select(
        "energy_avg, focus_avg, sensory_load_avg, mental_battery_avg, physical_health_avg, load_avg, sleep_hours_avg"
      )
      .eq("user_id", user.id)
      .gte("date", weekStartStr)
      .lt("date", today),
    supabase
      .from("user_analytics_daily")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("date", amsterdamIsoWeekMonday)
      .lt("date", today)
      .eq("dcic_overdrive_weekly_slot", true),
  ]);

  let ds = dailyState as Record<string, unknown> | null | undefined;
  if (ds?.dcic_mode === "overdrive" && ds.dcic_locked_until) {
    const lu = Date.parse(String(ds.dcic_locked_until));
    if (!Number.isNaN(lu) && lu <= Date.now()) {
      const { error: expireErr } = await supabase
        .from("daily_state")
        .update({
          dcic_mode: "focus",
          dcic_locked_until: null,
          dcic_overdrive_session_start: null,
        })
        .eq("user_id", user.id)
        .eq("date", today);
      if (expireErr) {
        console.error("expire overdrive:", expireErr);
      } else {
        ds = {
          ...ds,
          dcic_mode: "focus",
          dcic_locked_until: null,
          dcic_overdrive_session_start: null,
        };
      }
    }
  }

  const weekRowsFromAnalytics = (brainWeekAnalytics ?? []).map((row) =>
    analyticsBrainToDailyRowForBrain(
      row as {
        energy_avg?: number | null;
        focus_avg?: number | null;
        sensory_load_avg?: number | null;
        mental_battery_avg?: number | null;
        physical_health_avg?: number | null;
        load_avg?: number | null;
        sleep_hours_avg?: number | null;
      }
    )
  );
  const todayBrainRow: DailyRowForBrain = {
    energy: ds?.energy != null ? Number(ds.energy) : null,
    focus: ds?.focus != null ? Number(ds.focus) : null,
    sensory_load: ds?.sensory_load != null ? Number(ds.sensory_load) : null,
    load: ds?.load != null ? Number(ds.load) : null,
    mental_battery: ds?.mental_battery != null ? Number(ds.mental_battery) : null,
    physical_health: ds?.physical_health != null ? Number(ds.physical_health) : null,
    sleep_hours: ds?.sleep_hours != null ? Number(ds.sleep_hours) : null,
  };
  const hasTodayBrain =
    todayBrainRow.energy != null ||
    todayBrainRow.focus != null ||
    todayBrainRow.sensory_load != null;
  const dailyStateWeekMerged: DailyRowForBrain[] = [
    ...weekRowsFromAnalytics,
    ...(hasTodayBrain ? [todayBrainRow] : []),
  ];
  const warTierDaysLast7 = countWarTierDays(dailyStateWeekMerged);

  const totalXP = (xpData?.total_xp as number) ?? 0;
  const level = levelFromTotalXP(totalXP);

  const missions: Mission[] = (missionsData || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.name as string,
    xpReward: (m.xp_reward as number) ?? 100,
    energyCost: (m.energy_cost as number) ?? 15,
    completed: (m.completed as boolean) ?? false,
    active: (m.active as boolean) ?? false,
    startedAt: m.started_at as string | null,
    completedAt: m.completed_at as string | null,
    difficultyLevel: parseFloat((m.difficulty_level as string) ?? "0.5") || 0.5,
    focusRequirement: (m.focus_requirement as number | null) ?? null,
    socialIntensity: (m.social_intensity as number | null) ?? null,
    missionType: m.mission_type as Mission["missionType"],
    category: m.category as Mission["category"],
    skillLink: m.skill_link as Mission["skillLink"],
    recurrenceType: m.recurrence_type as Mission["recurrenceType"],
    streakEligible: m.streak_eligible as boolean | undefined,
    missionIntent: (m.mission_intent as Mission["missionIntent"]) ?? "normal",
    expiresAt: m.expires_at as string | null ?? null,
  }));

  const streak = {
    current: streakData?.current_streak ?? 0,
    longest: streakData?.longest_streak ?? 0,
    lastCompletionDate: streakData?.last_completion_date ?? null,
  };

  const achievements: Record<string, boolean> = {};
  (achievementsData || []).forEach((a) => {
    achievements[a.achievement_key] = true;
  });

  const skills: Record<string, boolean> = {};
  (skillsData || []).forEach((s) => {
    skills[s.skill_key] = true;
  });

  let financeState: GameState["finance"] = undefined;
  if (includeFinance) {
    const { getFinanceState } = await import("./finance-state");
    financeState = (await getFinanceState()) || undefined;
  }

  const rank = rankFromLevel(level);
  const gameState: GameState = {
    level,
    currentXP: totalXP,
    xpToNextLevel: xpRemainingToNextLevel(totalXP),
    stats: {
      energy: dailyBrainCircleToStat100(ds?.energy, 50),
      focus: dailyBrainCircleToStat100(ds?.focus, 50),
      load: dailyBrainCircleToStat100(ds?.sensory_load, 50),
    },
    missions,
    skills,
    streak,
    rank,
    achievements,
    finance: financeState,
    difficultyEngine: updateDifficulty(level, rank),
    mode: {
      current: "focus",
      lockedUntil: null,
      lastSwitch: null,
      overdriveSessionStart: null,
      overdriveAutoTriggered: false,
      overdriveTriggerReason: null,
      overdriveTriggeredAt: null,
      warStage: 1,
      suggested: null,
      nextWarBonus: null,
      brainStatusAveragePercent: null,
      warTierDaysLast7: warTierDaysLast7,
    },
    authority: {
      overrideChance: 0.15,
      lastOverrideDate: null,
      lastSuggestedMode: null,
      patterns: {
        missionSpamCount: 0,
        easyTaskAbuseCount: 0,
        modeSwitchAbuseCount: 0,
        lastAbuseDate: null,
        warSessionsThisWeek: 0,
        recoverySessionsThisWeek: 0,
        idleDaysThisWeek: 0,
      },
    },
    activeEvents: [],
    identity: {
      discipline: 0,
      resilience: 0,
      consistency: 0,
      constraints: {},
    },
  };

  applyBrainLayerToGameState(gameState, ds as Parameters<typeof applyBrainLayerToGameState>[1], {
    warTierDaysLast7,
  });

  const hasBrainCheckIn =
    ds != null && ds.energy != null && ds.focus != null;

  const avgPct = gameState.mode.brainStatusAveragePercent;

  let lockedMode = parseLockedDcicMode(ds?.dcic_mode);
  /** DB lock is sticky (RPC uses coalesce); clear when it no longer matches brain rules. */
  let staleDcicModeInDb = false;

  if (
    !hasBrainCheckIn &&
    lockedMode &&
    lockedMode !== "focus" &&
    lockedMode !== "overdrive"
  ) {
    lockedMode = null;
    staleDcicModeInDb = true;
  }

  if (lockedMode === "recovery" && (avgPct == null || avgPct >= 25)) {
    lockedMode = null;
    staleDcicModeInDb = true;
  }
  if (lockedMode === "war" && (avgPct == null || avgPct <= 75)) {
    lockedMode = null;
    staleDcicModeInDb = true;
  }

  if (lockedMode) {
    gameState.mode.current = lockedMode;
    gameState.mode.lockedUntil = (ds?.dcic_locked_until as string | null) ?? null;
    gameState.mode.overdriveSessionStart =
      lockedMode === "overdrive"
        ? (ds?.dcic_overdrive_session_start as string | null) ?? null
        : null;
    gameState.mode.overdriveAutoTriggered = Boolean(ds?.dcic_overdrive_auto_triggered);
    gameState.mode.overdriveTriggerReason =
      (ds?.dcic_overdrive_trigger_reason as string | null | undefined) ?? null;
    gameState.mode.overdriveTriggeredAt =
      (ds?.dcic_overdrive_triggered_at as string | null | undefined) ?? null;
    passiveRecoveryTick(gameState);
  } else {
    autoModeCheck(gameState);
    passiveRecoveryTick(gameState);
    gameState.mode.overdriveAutoTriggered = Boolean(ds?.dcic_overdrive_auto_triggered);
    gameState.mode.overdriveTriggerReason =
      (ds?.dcic_overdrive_trigger_reason as string | null | undefined) ?? null;
    gameState.mode.overdriveTriggeredAt =
      (ds?.dcic_overdrive_triggered_at as string | null | undefined) ?? null;

    // Auto-trigger Overdrive (mixed rules: momentum combo + streak rescue) when safe.
    const alreadyTriggeredToday = Boolean(ds?.dcic_overdrive_auto_triggered);
    const modeLocked = isModeLocked(gameState);
    const localHour = getAppTimezoneHour();
    const localWeekday = getAppTimezoneWeekday();
    const weeklySlotDays = pickWeeklySlotWeekdays(user.id, amsterdamIsoWeekMonday);
    const weeklyRandomSlotToday = weeklySlotDays.has(localWeekday);
    const weeklySlotTriggersThisIsoWeek =
      (weeklySlotHistoryCount ?? 0) +
      (ds?.dcic_overdrive_trigger_reason === "weekly_slot" ? 1 : 0);

    let completionsInLast45m = 0;
    let completionsToday = 0;
    let streakAtRisk = false;

    const lastCompletionDate = gameState.streak.lastCompletionDate;
    if (gameState.streak.current > 0 && lastCompletionDate) {
      streakAtRisk = lastCompletionDate === yesterdayDate(today);
    }

    // Only compute expensive completion windows when Overdrive could plausibly trigger.
    if (
      !alreadyTriggeredToday &&
      !modeLocked &&
      gameState.mode.current === "focus" &&
      gameState.mode.brainStatusAveragePercent != null &&
      ds?.energy != null &&
      ds?.focus != null
    ) {
      const nowMs = Date.now();
      const windowStartIso = new Date(nowMs - 45 * 60 * 1000).toISOString();
      const dayStartIso = `${today}T00:00:00`;
      const dayEndIso = `${today}T23:59:59.999`;

      const [tasks45, missions45, tasksToday, missionsToday] = await Promise.all([
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("completed_at", windowStartIso),
        supabase
          .from("behaviour_log")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .not("mission_completed_at", "is", null)
          .gte("mission_completed_at", windowStartIso),
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("completed_at", dayStartIso)
          .lte("completed_at", dayEndIso),
        supabase
          .from("behaviour_log")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .not("mission_completed_at", "is", null)
          .gte("mission_completed_at", dayStartIso)
          .lte("mission_completed_at", dayEndIso),
      ]);

      completionsInLast45m = (tasks45.count ?? 0) + (missions45.count ?? 0);
      completionsToday = (tasksToday.count ?? 0) + (missionsToday.count ?? 0);
    }

    const odDecision = maybeAutoTriggerOverdrive(gameState, {
      nowMs: Date.now(),
      localHour,
      alreadyTriggeredToday,
      modeLocked,
      completionsInLast45m,
      completionsToday,
      streakAtRisk,
      weeklyRandomSlotToday,
      weeklySlotTriggersThisIsoWeek,
    });

    if (odDecision.shouldTrigger) {
      switchMode(gameState, "overdrive", { forced: true });
      const nowIso = new Date().toISOString();
      const { error: odErr } = await supabase.from("daily_state").upsert(
        {
          user_id: user.id,
          date: today,
          dcic_mode: "overdrive",
          dcic_locked_until: gameState.mode.lockedUntil,
          dcic_overdrive_session_start: gameState.mode.overdriveSessionStart,
          dcic_overdrive_auto_triggered: true,
          dcic_overdrive_trigger_reason: odDecision.reason,
          dcic_overdrive_triggered_at: nowIso,
        },
        { onConflict: "user_id,date" }
      );
      if (odErr) {
        console.error("auto-trigger overdrive:", odErr);
      } else {
        void sendOverdriveActivatedPushIfEnabled(supabase, user.id, "auto");
      }
    } else {
      const { error: lockErr } = await supabase.rpc("lock_daily_dcic_mode_if_unset", {
        p_user_id: user.id,
        p_date: today,
        p_mode: gameState.mode.current,
      });
      if (lockErr) {
        console.error("lock_daily_dcic_mode_if_unset:", lockErr);
      }
    }
  }

  if (staleDcicModeInDb && ds) {
    const { error: modeFixErr } = await supabase
      .from("daily_state")
      .update({ dcic_mode: gameState.mode.current })
      .eq("user_id", user.id)
      .eq("date", today);
    if (modeFixErr) {
      console.error("dcic_mode stale lock fix:", modeFixErr);
    }
  }

  return gameState;
}

/**
 * Returns generated daily missions for the current user based on difficulty engine.
 * Use for daily reset or mission assignment; integrates with level/rank.
 */
export async function getGeneratedDailyMissions() {
  const state = await getGameState();
  if (!state) return [];
  return generateDailyMissions(state.difficultyEngine);
}

/**
 * Saves gameState to database.
 * @param persistUserXp — When false, skips writing `user_xp` (e.g. daily bootstrap) so we never clobber
 *   cumulative XP from `addXP` / tasks with a stale or mis-modeled DCIC snapshot.
 */
export async function saveGameState(
  gameState: GameState,
  options?: { persistUserXp?: boolean }
): Promise<boolean> {
  const persistUserXp = options?.persistUserXp !== false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    if (persistUserXp) {
      await supabase.from("user_xp").upsert(
        {
          user_id: user.id,
          total_xp: gameState.currentXP,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    // Update missions
    for (const mission of gameState.missions) {
      await supabase
        .from("missions")
        .update({
          active: mission.active,
          completed: mission.completed,
          started_at: mission.startedAt,
          completed_at: mission.completedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mission.id);
    }

    // Update streak (handled by trigger, but ensure record exists)
    await supabase
      .from("user_streak")
      .upsert({
        user_id: user.id,
        current_streak: gameState.streak.current,
        longest_streak: gameState.streak.longest,
        last_completion_date: gameState.streak.lastCompletionDate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // Update daily state stats (DB brain circles are 1–10; gameState.stats are 0–100).
    const today = todayDateString();
    await supabase.from("daily_state").upsert(
      {
        user_id: user.id,
        date: today,
        energy: stat100ToDailyBrainCircle(gameState.stats.energy),
        focus: stat100ToDailyBrainCircle(gameState.stats.focus),
        sensory_load: stat100ToDailyBrainCircle(gameState.stats.load),
        dcic_mode: gameState.mode.current,
        dcic_locked_until: gameState.mode.lockedUntil,
        dcic_overdrive_session_start:
          gameState.mode.current === "overdrive"
            ? gameState.mode.overdriveSessionStart
            : null,
      },
      { onConflict: "user_id,date" }
    );

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return true;
  } catch (error) {
    console.error("Error saving gameState:", error);
    return false;
  }
}

/**
 * Persists operational DCIC mode for today (e.g. Overdrive activation from settings).
 */
export async function persistDcicOperationalMode(
  newMode: GameState["mode"]["current"]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const gameState = await getGameState({ includeFinance: false });
  if (!gameState) return { ok: false, error: "Geen game state" };
  if (
    newMode === "overdrive" &&
    gameState.mode.current !== "overdrive" &&
    !isOverdriveActivationTimeAllowed(getAppTimezoneHour())
  ) {
    return {
      ok: false,
      error: "Overdrive kan alleen tussen 08:00 en 18:00 worden gestart.",
    };
  }
  const prevMode = gameState.mode.current;
  switchMode(gameState, newMode, { forced: true });
  const ok = await saveGameState(gameState);
  if (ok && newMode === "overdrive" && prevMode !== "overdrive") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) void sendOverdriveActivatedPushIfEnabled(supabase, user.id, "manual");
  }
  return ok ? { ok: true } : { ok: false, error: "Opslaan mislukt" };
}

