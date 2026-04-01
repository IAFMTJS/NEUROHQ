"use server";

/**
 * Single orchestration entry for “mission completed”: DB updates, XP, streak, analytics,
 * recurrence, progression, behaviour log, revalidation. Call `completeTask` from tasks.ts
 * remains the stable import for UI/offline queue; this module is the implementation home.
 */

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database.types";
import type { ReputationScore } from "@/lib/identity-engine";
import { isRecoveryTask } from "@/lib/recovery-task";
import { recordAvoidanceCompletion } from "@/app/actions/avoidance-tracker";
import { trackEvent } from "@/app/actions/analytics-events";
import { revalidatePath } from "next/cache";
import { revalidateTagMax } from "@/lib/revalidate";
import { parseMissionProgressionFromTaskTags } from "@/lib/mission-progression";
import { computeNextRecurrenceDate } from "@/lib/tasks-recurrence";
import { logTaskEvent } from "@/app/actions/task-events";

export type CompleteTaskResult = {
  levelUp: boolean;
  newLevel: number;
  lowSynergy?: boolean;
  reputation?: ReputationScore | null;
  performanceRank?: "S" | "A" | "B" | "C" | null;
  performanceScore?: number | null;
  xpAwarded?: number;
  rankPromotion?: boolean;
  newRank?: string;
  previousRank?: string;
};

export async function completeMission(
  id: string,
  options?: { startedAt?: string | null }
): Promise<CompleteTaskResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: task } = await supabase
    .from("tasks")
    .select("recurrence_rule, recurrence_weekdays, due_date, title, energy_required, focus_required, mental_load, social_load, priority, category, impact, urgency, domain, discipline_weight, base_xp, avoidance_tag, hobby_tag, mission_intent, task_type, intensity, duration_minutes, task_tags")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  const { error } = await supabase
    .from("tasks")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  const t = task as {
    recurrence_rule?: string | null;
    recurrence_weekdays?: string | null;
    due_date: string;
    title: string;
    energy_required?: number | null;
    focus_required?: number | null;
    mental_load?: number | null;
    social_load?: number | null;
    priority?: number | null;
    category?: string | null;
    impact?: number | null;
    urgency?: number | null;
    domain?: string | null;
    discipline_weight?: number | null;
    base_xp?: number | null;
    avoidance_tag?: string | null;
    hobby_tag?: string | null;
    mission_intent?: string | null;
    task_type?: string | null;
    intensity?: number | null;
    duration_minutes?: number | null;
    task_tags?: string[] | null;
  } | null;
  const completionDate = t?.due_date ?? new Date().toISOString().slice(0, 10);

  const [{ data: dailyState }, { data: recentCompletions }] = await Promise.all([
    supabase.from("daily_state").select("energy, focus").eq("user_id", user.id).eq("date", completionDate).single(),
    supabase.from("task_events").select("id").eq("user_id", user.id).eq("event_type", "complete").gte("occurred_at", new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  let performanceScore: number | null = null;
  let performanceRank: "S" | "A" | "B" | "C" | null = null;
  try {
    const { computePerformanceScore, getRankFromScore } = await import("@/lib/performance-rank");
    const consistency = Math.min(1, ((recentCompletions?.length ?? 0) + 1) / 7);
    const score = computePerformanceScore({
      taskEnergy: t?.energy_required ?? 5,
      taskFocus: t?.focus_required ?? 5,
      dailyEnergy: (dailyState as { energy?: number | null } | null)?.energy ?? 5,
      dailyFocus: (dailyState as { focus?: number | null } | null)?.focus ?? 5,
      onTime: completionDate <= new Date().toISOString().slice(0, 10),
      consistency,
    });
    performanceScore = score;
    performanceRank = getRankFromScore(score);
  } catch {
    performanceRank = "B";
  }

  const durationToCompleteSeconds =
    options?.startedAt != null
      ? Math.max(0, Math.round((Date.now() - new Date(options.startedAt).getTime()) / 1000))
      : null;
  await logTaskEvent({
    taskId: id,
    eventType: "complete",
    performanceScore,
    performanceRank,
    durationToCompleteSeconds,
  });
  await trackEvent("mission_completed", { taskId: id, performanceRank, performanceScore });

  if (t?.recurrence_rule) {
    const nextStr = computeNextRecurrenceDate(t.due_date, t.recurrence_rule ?? null, t.recurrence_weekdays ?? null);
    if (nextStr) {
      await supabase.from("tasks").insert({
        user_id: user.id,
        title: t.title,
        due_date: nextStr,
        energy_required: t.energy_required ?? null,
        focus_required: t.focus_required ?? null,
        mental_load: t.mental_load ?? null,
        social_load: t.social_load ?? null,
        priority: t.priority ?? null,
        recurrence_rule: t.recurrence_rule,
        recurrence_weekdays: t.recurrence_weekdays ?? null,
        category: t.category ?? null,
        impact: t.impact ?? null,
        urgency: t.urgency ?? null,
        base_xp: t.base_xp ?? null,
        hobby_tag: t.hobby_tag ?? null,
        task_type: (t.task_type as never) ?? null,
        intensity: t.intensity ?? null,
        duration_minutes: t.duration_minutes ?? null,
        task_tags: t.task_tags ?? [],
      } as TablesInsert<"tasks">);
      revalidateTagMax(`tasks-${user.id}-${nextStr}`);
    }
  }
  const { awardXPForTaskComplete, getXP } = await import("./xp");
  const { awardEconomyForTaskComplete } = await import("./economy");
  const { checkChainCompletionOnTaskComplete } = await import("./mission-chains");
  const { recordDailyXPAndMissions, upsertDailyAnalytics } = await import("./analytics");
  const { updateStreakOnTaskComplete } = await import("./streak");
  const { rankFromLevel } = await import("@/lib/rank-ladder");
  const levelBefore = (await getXP()).level;
  const xpResult = await awardXPForTaskComplete(t?.domain ?? null, id, t?.base_xp ?? undefined, completionDate, performanceRank ?? undefined);
  const xpAwarded = xpResult.xpAwarded;
  const newLevel = xpResult.newLevel ?? levelBefore;
  const previousRank = rankFromLevel(levelBefore);
  const newRank = rankFromLevel(newLevel);
  const rankPromotion = previousRank !== newRank;

  const [chainResult] = await Promise.all([
    checkChainCompletionOnTaskComplete(id),
    updateStreakOnTaskComplete(completionDate),
  ]);
  await awardEconomyForTaskComplete({ chainCompleted: chainResult.chainCompleted });

  const afterEconomy: Promise<unknown>[] = [];
  if (t?.due_date) {
    afterEconomy.push(
      recordDailyXPAndMissions(t.due_date, xpAwarded),
      upsertDailyAnalytics(t.due_date)
    );
  }
  const { applyRecoveryCompletionBonus } = await import("./recovery-engine");
  if (t && isRecoveryTask(t)) afterEconomy.push(applyRecoveryCompletionBonus(completionDate));
  if (t?.avoidance_tag === "household" || t?.avoidance_tag === "administration" || t?.avoidance_tag === "social") {
    afterEconomy.push(recordAvoidanceCompletion(t.avoidance_tag));
  }
  await Promise.all(afterEconomy);

  const progressionMeta = parseMissionProgressionFromTaskTags(t?.task_tags ?? null);
  if (progressionMeta) {
    try {
      const { data: progressionRow } = await (supabase as any)
        .from("mission_progression_state")
        .select("current_tier, completions")
        .eq("user_id", user.id)
        .eq("progression_key", progressionMeta.key)
        .maybeSingle();
      const currentTierRaw = (progressionRow as { current_tier?: number | null } | null)?.current_tier ?? 0;
      const completionsRaw = (progressionRow as { completions?: number | null } | null)?.completions ?? 0;
      const currentTier = Number.isFinite(currentTierRaw) ? Number(currentTierRaw) : 0;
      const completions = Number.isFinite(completionsRaw) ? Number(completionsRaw) : 0;
      await (supabase as any).from("mission_progression_state").upsert(
        {
          user_id: user.id,
          progression_key: progressionMeta.key,
          current_tier: Math.max(currentTier, progressionMeta.tier),
          completions: completions + 1,
          last_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,progression_key" }
      );
    } catch (err) {
      console.error("Mission progression update failed:", err);
    }
  }

  try {
    const { applyProtocolProgressFromMissionTags } = await import("./protocol-progress");
    await applyProtocolProgressFromMissionTags(user.id, t?.task_tags ?? null, "complete");
  } catch (err) {
    console.error("Protocol progress sync on mission complete failed:", err);
  }

  const { logBehaviourEntry } = await import("./dcic/behaviour-log");
  const impactToDifficulty = (i: number | null | undefined): number =>
    i === 3 ? 0.9 : i === 2 ? 0.65 : i === 1 ? 0.4 : 0.5;
  void logBehaviourEntry({
    date: completionDate,
    missionStartedAt: null,
    missionCompletedAt: new Date().toISOString(),
    energyBefore: 0,
    energyAfter: 0,
    resistedBeforeStart: false,
    difficultyLevel: impactToDifficulty(t?.impact),
    xpGained: xpAwarded,
  }).catch((err) => {
    console.error("Behaviour log on task complete:", err);
  });
  void import("./identity-engine").then(({ refreshUserReputation }) => refreshUserReputation(user.id));

  const dateTag = t?.due_date ?? new Date().toISOString().slice(0, 10);
  revalidateTagMax(`tasks-${user.id}-${dateTag}`);
  const { revalidateDashboardCache } = await import("./dashboard-data");
  revalidateDashboardCache(user.id);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/xp");
  revalidatePath("/learning");
  revalidatePath("/strategy");
  revalidateTagMax("decision-blocks");

  let reputation: ReputationScore | null = null;
  if (xpResult.levelUp === true) {
    const { getIdentityEngine } = await import("./identity-engine");
    try {
      const identityEngine = await getIdentityEngine();
      reputation = identityEngine.reputation;
    } catch {
      reputation = null;
    }
  }

  return {
    levelUp: xpResult.levelUp === true,
    newLevel: xpResult.newLevel ?? 0,
    performanceRank: performanceRank ?? undefined,
    performanceScore: performanceScore ?? undefined,
    xpAwarded,
    ...(xpResult.lowSynergy ? { lowSynergy: true } : {}),
    ...(reputation ? { reputation } : {}),
    ...(rankPromotion ? { rankPromotion: true, newRank, previousRank } : {}),
  };
}
