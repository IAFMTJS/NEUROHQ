"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface BehaviorState {
  lastActiveDate: string | null;
  lastStudyDate: string | null;
  inactiveDays: number;
  noBookSelected: boolean;
  weeklyConsistency: number;
  missedReason: "no_time" | "no_energy" | "forgot" | "low_motivation" | null;
  missedReasonCount: number;
}

export interface StudyPlan {
  dailyGoalMinutes: number;
  preferredTime: string | null;
  reminderEnabled: boolean;
}

export interface AccountabilitySettings {
  enabled: boolean;
  penaltyXPEnabled: boolean;
  penaltyXPAmount: number;
  streakFreezeTokens: number;
}

/** Get or initialize behavior state */
export async function getBehaviorState(): Promise<BehaviorState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      lastActiveDate: null,
      lastStudyDate: null,
      inactiveDays: 0,
      noBookSelected: true,
      weeklyConsistency: 0,
      missedReason: null,
      missedReasonCount: 0,
    };
  }

  const { data } = await supabase
    .from("user_behavior")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (data) {
    return {
      lastActiveDate: data.last_active_date,
      lastStudyDate: data.last_study_date,
      inactiveDays: data.inactive_days ?? 0,
      noBookSelected: data.no_book_selected ?? true,
      weeklyConsistency: data.weekly_consistency ?? 0,
      missedReason: data.missed_reason as "no_time" | "no_energy" | "forgot" | "low_motivation" | null,
      missedReasonCount: data.missed_reason_count ?? 0,
    };
  }

  // Initialize if doesn't exist
  const today = new Date().toISOString().slice(0, 10);
  const initialState: BehaviorState = {
    lastActiveDate: today,
    lastStudyDate: null,
    inactiveDays: 0,
    noBookSelected: true,
    weeklyConsistency: 0,
    missedReason: null,
    missedReasonCount: 0,
  };

  await supabase.from("user_behavior").upsert({
    user_id: user.id,
    ...initialState,
    last_active_date: initialState.lastActiveDate,
    last_study_date: initialState.lastStudyDate,
  });

  return initialState;
}

/** Update last active date (called on app start) */
export async function updateLastActiveDate(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("user_behavior").upsert({
    user_id: user.id,
    last_active_date: today,
  }, {
    onConflict: "user_id",
  });
}

/** Update last study date (called when learning session is added) */
export async function updateLastStudyDate(date?: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const studyDate = date || new Date().toISOString().slice(0, 10);
  await supabase.from("user_behavior").upsert({
    user_id: user.id,
    last_study_date: studyDate,
    inactive_days: 0,
  }, {
    onConflict: "user_id",
  });
}

/** Check inactivity and return days since last study. Do not warn if user has learning sessions in last 7 days. */
export async function checkInactivity(): Promise<{ inactiveDays: number; shouldWarn: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { inactiveDays: 0, shouldWarn: false };

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: sessions } = await supabase
    .from("learning_sessions")
    .select("date")
    .eq("user_id", user.id)
    .gte("date", sevenDaysAgo)
    .lte("date", today);
  if ((sessions ?? []).length > 0) {
    return { inactiveDays: 0, shouldWarn: false };
  }

  const behavior = await getBehaviorState();
  if (!behavior.lastStudyDate) {
    return { inactiveDays: 999, shouldWarn: true };
  }

  const lastStudy = new Date(behavior.lastStudyDate);
  const diffDays = Math.floor((new Date().getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));

  await supabase.from("user_behavior").upsert({
    user_id: user.id,
    inactive_days: diffDays,
  }, {
    onConflict: "user_id",
  });

  return {
    inactiveDays: diffDays,
    shouldWarn: diffDays >= 7,
  };
}

/** Update book selection status */
export async function updateBookSelectionStatus(hasBook: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("user_behavior").upsert({
    user_id: user.id,
    no_book_selected: !hasBook,
  }, {
    onConflict: "user_id",
  });
}

/** Log missed reason */
export async function logMissedReason(reason: "no_time" | "no_energy" | "forgot" | "low_motivation"): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const behavior = await getBehaviorState();
  const newCount = behavior.missedReason === reason ? behavior.missedReasonCount + 1 : 1;

  await supabase.from("user_behavior").upsert({
    user_id: user.id,
    missed_reason: reason,
    missed_reason_count: newCount,
  }, {
    onConflict: "user_id",
  });

  revalidatePath("/learning");
}

/** Get study plan */
export async function getStudyPlan(): Promise<StudyPlan> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      dailyGoalMinutes: 30,
      preferredTime: null,
      reminderEnabled: true,
    };
  }

  const { data } = await supabase
    .from("study_plan")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (data) {
    return {
      dailyGoalMinutes: data.daily_goal_minutes ?? 30,
      preferredTime: data.preferred_time,
      reminderEnabled: data.reminder_enabled ?? true,
    };
  }

  // Initialize default
  const defaultPlan: StudyPlan = {
    dailyGoalMinutes: 30,
    preferredTime: null,
    reminderEnabled: true,
  };

  await supabase.from("study_plan").insert({
    user_id: user.id,
    daily_goal_minutes: defaultPlan.dailyGoalMinutes,
    preferred_time: defaultPlan.preferredTime,
    reminder_enabled: defaultPlan.reminderEnabled,
  });

  return defaultPlan;
}

/** Update study plan */
export async function updateStudyPlan(plan: Partial<StudyPlan>): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("study_plan").upsert({
    user_id: user.id,
    daily_goal_minutes: plan.dailyGoalMinutes,
    preferred_time: plan.preferredTime,
    reminder_enabled: plan.reminderEnabled,
  }, {
    onConflict: "user_id",
  });

  revalidatePath("/learning");
}

/** Get accountability settings */
export async function getAccountabilitySettings(): Promise<AccountabilitySettings> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      enabled: true,
      penaltyXPEnabled: true,
      penaltyXPAmount: 50,
      streakFreezeTokens: 1,
    };
  }

  const { data } = await supabase
    .from("accountability_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (data) {
    return {
      enabled: data.enabled ?? true,
      penaltyXPEnabled: data.penalty_xp_enabled ?? true,
      penaltyXPAmount: data.penalty_xp_amount ?? 50,
      streakFreezeTokens: data.streak_freeze_tokens ?? 1,
    };
  }

  // Initialize default
  const defaultSettings: AccountabilitySettings = {
    enabled: true,
    penaltyXPEnabled: true,
    penaltyXPAmount: 50,
    streakFreezeTokens: 1,
  };

  await supabase.from("accountability_settings").insert({
    user_id: user.id,
    enabled: defaultSettings.enabled,
    penalty_xp_enabled: defaultSettings.penaltyXPEnabled,
    penalty_xp_amount: defaultSettings.penaltyXPAmount,
    streak_freeze_tokens: defaultSettings.streakFreezeTokens,
  });

  return defaultSettings;
}

/** Apply penalty XP for missed day */
export async function applyPenaltyXP(): Promise<void> {
  const settings = await getAccountabilitySettings();
  if (!settings.enabled || !settings.penaltyXPEnabled) return;

  const { deductXP } = await import("./xp");
  await deductXP(settings.penaltyXPAmount);
  revalidatePath("/learning");
}

/** Use freeze token to prevent streak loss */
export async function useFreezeToken(): Promise<boolean> {
  const settings = await getAccountabilitySettings();
  if (!settings.enabled || settings.streakFreezeTokens <= 0) return false;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  await supabase.from("accountability_settings").update({
    streak_freeze_tokens: settings.streakFreezeTokens - 1,
  }).eq("user_id", user.id);

  revalidatePath("/learning");
  return true;
}

/** Calculate weekly consistency */
export async function calculateWeeklyConsistency(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

  const { data: sessions } = await supabase
    .from("learning_sessions")
    .select("date")
    .eq("user_id", user.id)
    .gte("date", weekStart.toISOString().slice(0, 10));

  const uniqueDays = new Set(sessions?.map((s) => s.date) || []).size;
  const consistency = Math.round((uniqueDays / 7) * 100);

  await supabase.from("user_behavior").upsert({
    user_id: user.id,
    weekly_consistency: consistency,
  }, {
    onConflict: "user_id",
  });

  return consistency;
}

/** Detect behavior patterns for AI coach */
export async function detectBehaviorPatterns(): Promise<void> {
  const behavior = await getBehaviorState();
  if (behavior.missedReasonCount < 2) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  let patternType: string | null = null;
  let suggestion: string | null = null;

  if (behavior.missedReason === "no_time" && behavior.missedReasonCount >= 2) {
    patternType = "missed_after_busy";
    suggestion = "Pattern detected: you skip after busy days. Try scheduling shorter 10-minute sessions.";
  }

  // Check if pattern already exists
  if (patternType) {
    const { data: existing } = await supabase
      .from("behavior_patterns")
      .select("id")
      .eq("user_id", user.id)
      .eq("pattern_type", patternType)
      .eq("acknowledged", false)
      .order("detected_at", { ascending: false })
      .limit(1)
      .single();

    if (!existing) {
      await supabase.from("behavior_patterns").insert({
        user_id: user.id,
        pattern_type: patternType,
        suggestion,
      });
    }
  }
}
