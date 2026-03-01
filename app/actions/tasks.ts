"use server";

import { createClient, createClientWithToken } from "@/lib/supabase/server";
import type { Task, TablesInsert } from "@/types/database.types";
import type { ReputationScore } from "@/lib/identity-engine";
import { isRecoveryTask } from "@/lib/recovery-task";
import { incrementAvoidanceSkip, recordAvoidanceCompletion } from "@/app/actions/avoidance-tracker";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

export type TaskListMode = "normal" | "low_energy" | "stabilize" | "driven";

export async function getTodaysTasks(date: string, mode: TaskListMode): Promise<{ tasks: Task[]; carryOverCount: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { tasks: [], carryOverCount: 0 };
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";

  return unstable_cache(
    async (userId: string, dateKey: string, modeKey: TaskListMode, token: string) => {
      const client = createClientWithToken(token);
      const nowIso = new Date().toISOString();
      let query = client
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("due_date", dateKey)
        .eq("completed", false)
        .is("parent_task_id", null)
        .is("deleted_at", null)
        .or(`snooze_until.is.null,snooze_until.lt.${nowIso}`);

      if (modeKey === "low_energy") {
        query = query.or("energy_required.is.null,energy_required.lt.4");
      }

      query = query.order("created_at", { ascending: true });
      const { data: tasks } = await query;
      let ordered = tasks ?? [];
      const categoryOrder = (c: string | null) => (c === "work" ? 0 : c === "personal" ? 1 : 2);
      ordered = [...ordered].sort((a, b) => {
        const catA = categoryOrder((a as { category?: string | null }).category ?? null);
        const catB = categoryOrder((b as { category?: string | null }).category ?? null);
        if (catA !== catB) return catA - catB;
        if (modeKey === "driven") {
          const ia = (a as { impact?: number | null }).impact ?? 0;
          const ib = (b as { impact?: number | null }).impact ?? 0;
          if (ib !== ia) return ib - ia;
          const pa = (a as { priority?: number | null }).priority ?? 0;
          const pb = (b as { priority?: number | null }).priority ?? 0;
          if (pb !== pa) return pb - pa;
        }
        return new Date((a as { created_at?: string }).created_at ?? 0).getTime() - new Date((b as { created_at?: string }).created_at ?? 0).getTime();
      });

      const maxCarryOver = Math.max(0, ...(tasks ?? []).map((t) => (t as { carry_over_count?: number }).carry_over_count ?? 0));
      return { tasks: ordered as Task[], carryOverCount: maxCarryOver };
    },
    ["tasks", user.id, date, mode],
    { tags: [`tasks-${user.id}-${date}`], revalidate: 60 }
  )(user.id, date, mode, accessToken);
}

export async function getTasksForDate(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("due_date", date)
    .is("parent_task_id", null)
    .is("deleted_at", null)
    .or(`snooze_until.is.null,snooze_until.lt.${nowIso}`)
    .order("completed")
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Tasks per date for a range (for calendar prefetch: avoid loading on month/day change). */
export async function getTasksForDateRange(startDate: string, endDate: string): Promise<Record<string, unknown[]>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .gte("due_date", startDate)
    .lte("due_date", endDate)
    .is("parent_task_id", null)
    .is("deleted_at", null)
    .or(`snooze_until.is.null,snooze_until.lt.${nowIso}`)
    .order("due_date")
    .order("completed")
    .order("created_at", { ascending: true });
  const byDate: Record<string, unknown[]> = {};
  for (const row of data ?? []) {
    const d = (row as { due_date: string }).due_date;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(row);
  }
  return byDate;
}

/** Per-day planned load for a week (Calendar Modal 3.0: time budget, overload, burnout). */
export type DayPlannedLoad = { date: string; taskCount: number; totalEnergy: number; totalPlannedMinutes?: number; isOverload?: boolean };

const MINUTES_PER_ENERGY = 8;

export async function getWeekPlannedLoad(weekStartStr: string): Promise<DayPlannedLoad[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const start = new Date(weekStartStr + "T12:00:00Z");
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const { data: tasks } = await supabase
    .from("tasks")
    .select("due_date, energy_required")
    .eq("user_id", user.id)
    .eq("completed", false)
    .is("deleted_at", null)
    .in("due_date", dates);
  const byDate: Record<string, { count: number; energy: number; minutes: number }> = {};
  for (const date of dates) byDate[date] = { count: 0, energy: 0, minutes: 0 };
  for (const t of tasks ?? []) {
    const d = (t as { due_date: string; energy_required: number | null }).due_date;
    const energy = Math.min(10, Math.max(1, (t as { energy_required: number | null }).energy_required ?? 2));
    if (byDate[d]) {
      byDate[d].count++;
      byDate[d].energy += energy;
      byDate[d].minutes += energy * MINUTES_PER_ENERGY;
    }
  }
  const ENERGY_CAP = 10;
  return dates.map((date) => ({
    date,
    taskCount: byDate[date].count,
    totalEnergy: byDate[date].energy,
    totalPlannedMinutes: byDate[date].minutes,
    isOverload: byDate[date].energy > ENERGY_CAP,
  }));
}

export type MissionIntent = "discipline" | "recovery" | "pressure" | "alignment" | "experiment";
export type StrategyDomainTask = "discipline" | "health" | "learning" | "business";
export type AvoidanceTag = "household" | "administration" | "social";
export type HobbyTag = "fitness" | "music" | "language" | "creative";

export async function createTask(params: {
  title: string;
  due_date: string;
  energy_required?: number | null;
  focus_required?: number | null;
  mental_load?: number | null;
  social_load?: number | null;
  priority?: number | null;
  parent_task_id?: string | null;
  recurrence_rule?: "daily" | "weekly" | "monthly" | null;
  recurrence_weekdays?: string | null;
  category?: "work" | "personal" | null;
  impact?: number | null;
  urgency?: number | null;
  notes?: string | null;
  domain?: StrategyDomainTask | null;
  cognitive_load?: number | null;
  emotional_resistance?: number | null;
  discipline_weight?: number | null;
  strategic_value?: number | null;
  psychology_label?: string | null;
  mission_intent?: MissionIntent | null;
  /** Optional: link to mission chain (Add Mission step 5: chain/new). */
  mission_chain_id?: string | null;
  /** How completion is validated: binary, structured, high_stakes. */
  validation_type?: "binary" | "structured" | "high_stakes" | null;
  /** Base XP on completion (level: 5=weinig, 10=normaal, 20=veel); null = default 10. */
  base_xp?: number | null;
  /** Optional avoidance tag for Confrontation Layer (household, administration, social). */
  avoidance_tag?: AvoidanceTag | null;
  /** Optional hobby tag to link this task to a hobby commitment. */
  hobby_tag?: HobbyTag | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je bent niet ingelogd. Log opnieuw in.");

  // Brainstatus rule: very high mental load blocks new missions for that day.
  // sensory_load is 1–10; >80% ~= 9–10. Auto-missies (MasterPoolAuto) worden niet geblokkeerd.
  const isAutoMission = params.psychology_label === "MasterPoolAuto";
  if (!isAutoMission) {
    try {
      const { data: state } = await supabase
        .from("daily_state")
        .select("sensory_load")
        .eq("user_id", user.id)
        .eq("date", params.due_date)
        .single();
      const sensory = (state as { sensory_load?: number | null } | null)?.sensory_load ?? null;
      if (sensory != null && sensory >= 9) {
        throw new Error("Te hoge mentale belasting voor die dag. Voeg geen nieuwe missies toe — kies light of plan voor later.");
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Te hoge mentale belasting")) throw e;
    }
  }

  const row: Record<string, unknown> = {
    user_id: user.id,
    title: params.title,
    due_date: params.due_date,
    energy_required: params.energy_required ?? null,
    focus_required: params.focus_required ?? null,
    mental_load: params.mental_load ?? null,
    social_load: params.social_load ?? null,
    priority: params.priority ?? null,
    parent_task_id: params.parent_task_id ?? null,
    recurrence_rule: params.recurrence_rule ?? null,
    recurrence_weekdays: params.recurrence_weekdays ?? null,
    category: params.category ?? null,
    impact: params.impact ?? null,
    urgency: params.urgency ?? null,
    notes: params.notes ?? null,
  };
  if (params.domain != null) row.domain = params.domain;
  if (params.cognitive_load != null) row.cognitive_load = params.cognitive_load;
  if (params.emotional_resistance != null) row.emotional_resistance = params.emotional_resistance;
  if (params.discipline_weight != null) row.discipline_weight = params.discipline_weight;
  if (params.strategic_value != null) row.strategic_value = params.strategic_value;
  if (params.psychology_label != null) row.psychology_label = params.psychology_label;
  if (params.mission_intent != null) row.mission_intent = params.mission_intent;
  if (params.mission_chain_id != null) row.mission_chain_id = params.mission_chain_id;
  if (params.validation_type != null) row.validation_type = params.validation_type;
  if (params.base_xp != null) row.base_xp = params.base_xp;
  if (params.avoidance_tag != null) row.avoidance_tag = params.avoidance_tag;
  if (params.hobby_tag != null) row.hobby_tag = params.hobby_tag;

  const { data, error } = await supabase
    .from("tasks")
    .insert(row as TablesInsert<"tasks">)
    .select("id")
    .single();
  if (error) {
    const msg = error.code === "PGRST301" || error.message?.toLowerCase().includes("auth") || error.message?.toLowerCase().includes("jwt")
      ? "Je sessie is verlopen. Log opnieuw in."
      : error.message?.toLowerCase().includes("unique") || error.message?.toLowerCase().includes("violates")
        ? "Deze taak kon niet worden opgeslagen. Vernieuw de pagina en probeer opnieuw."
        : "De taak kon niet worden toegevoegd. Controleer of je nog bent ingelogd en probeer het opnieuw.";
    throw new Error(msg);
  }
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { ok: true as const, id: data?.id };
}

/** ISO weekday 1=Mon .. 7=Sun. JS getDay() 0=Sun..6=Sat so ISO = getDay() || 7 */
function getISOWeekday(d: Date): number {
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}

/** Next date on or after start whose ISO weekday is in weekdays (1-7). */
function nextWeekdayDate(start: Date, weekdays: number[]): string {
  let d = new Date(start.getTime());
  for (let i = 0; i < 8; i++) {
    if (weekdays.includes(getISOWeekday(d))) return d.toISOString().slice(0, 10);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

/** Log task lifecycle event for completion rate, resistance index, ROI (Performance Engine). */
export async function logTaskEvent(params: {
  taskId: string;
  eventType: "view" | "start" | "complete" | "abandon";
  durationBeforeStartSeconds?: number | null;
  durationToCompleteSeconds?: number | null;
  /** Fase 3: 0–100 completion quality score. */
  performanceScore?: number | null;
  /** Fase 3: S/A/B/C rank. */
  performanceRank?: "S" | "A" | "B" | "C" | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("task_events").insert({
    user_id: user.id,
    task_id: params.taskId,
    event_type: params.eventType,
    duration_before_start_seconds: params.durationBeforeStartSeconds ?? null,
    duration_to_complete_seconds: params.durationToCompleteSeconds ?? null,
    performance_score: params.performanceScore ?? null,
    performance_rank: params.performanceRank ?? null,
  });
}

export type CompleteTaskResult = {
  levelUp: boolean;
  newLevel: number;
  lowSynergy?: boolean;
  reputation?: ReputationScore | null;
  /** Fase 3: S/A/B/C performance rank for this completion. */
  performanceRank?: "S" | "A" | "B" | "C" | null;
  performanceScore?: number | null;
  xpAwarded?: number;
};

function computeNextRecurrenceDate(dueDate: string, recurrenceRule: string | null | undefined, recurrenceWeekdays: string | null | undefined): string | null {
  if (!recurrenceRule) return null;
  const base = new Date(dueDate + "T12:00:00Z");

  if (recurrenceRule === "daily") {
    base.setUTCDate(base.getUTCDate() + 1);
    return base.toISOString().slice(0, 10);
  }

  if (recurrenceRule === "weekly" && recurrenceWeekdays?.trim()) {
    const weekdays = recurrenceWeekdays
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => n >= 1 && n <= 7);
    if (weekdays.length === 0) {
      base.setUTCDate(base.getUTCDate() + 7);
      return base.toISOString().slice(0, 10);
    }
    const nextDay = new Date(base);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    return nextWeekdayDate(nextDay, weekdays);
  }

  if (recurrenceRule === "weekly") {
    base.setUTCDate(base.getUTCDate() + 7);
    return base.toISOString().slice(0, 10);
  }

  if (recurrenceRule === "monthly") {
    const day = base.getUTCDate();
    base.setUTCMonth(base.getUTCMonth() + 1);
    if (base.getUTCDate() !== day) base.setUTCDate(0);
    return base.toISOString().slice(0, 10);
  }

  return null;
}

export async function completeTask(id: string): Promise<CompleteTaskResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: task } = await supabase
    .from("tasks")
    .select("recurrence_rule, recurrence_weekdays, due_date, title, energy_required, focus_required, mental_load, social_load, priority, category, impact, urgency, domain, discipline_weight, base_xp, avoidance_tag, hobby_tag, mission_intent")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  const { error } = await supabase
    .from("tasks")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  const t = task as { recurrence_rule?: string | null; recurrence_weekdays?: string | null; due_date: string; title: string; energy_required?: number | null; focus_required?: number | null; mental_load?: number | null; social_load?: number | null; priority?: number | null; category?: string | null; impact?: number | null; urgency?: number | null; domain?: string | null; discipline_weight?: number | null; base_xp?: number | null; avoidance_tag?: string | null; hobby_tag?: string | null; mission_intent?: string | null } | null;
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

  await logTaskEvent({ taskId: id, eventType: "complete", performanceScore, performanceRank });

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
      } as TablesInsert<"tasks">);
    }
  }
  const { awardXPForTaskComplete } = await import("./xp");
  const { awardEconomyForTaskComplete } = await import("./economy");
  const { checkChainCompletionOnTaskComplete } = await import("./mission-chains");
  const { recordDailyXPAndMissions, upsertDailyAnalytics } = await import("./analytics");
  const { updateStreakOnTaskComplete } = await import("./streak");
  const xpResult = await awardXPForTaskComplete(t?.domain ?? null, id, t?.base_xp ?? undefined, completionDate, performanceRank ?? undefined);
  const xpAwarded = xpResult.xpAwarded;
  const chainResult = await checkChainCompletionOnTaskComplete(id);
  await awardEconomyForTaskComplete({ chainCompleted: chainResult.chainCompleted });
  await updateStreakOnTaskComplete(completionDate);
  if (t?.due_date) {
    await recordDailyXPAndMissions(t.due_date, xpAwarded);
    await upsertDailyAnalytics(t.due_date);
  }
  const { applyRecoveryCompletionBonus } = await import("./recovery-engine");
  if (t && isRecoveryTask(t)) await applyRecoveryCompletionBonus(completionDate);
  const { logBehaviourEntry } = await import("./dcic/behaviour-log");
  await logBehaviourEntry({
    date: completionDate,
    missionStartedAt: null,
    missionCompletedAt: new Date().toISOString(),
    energyBefore: 0,
    energyAfter: 0,
    resistedBeforeStart: false,
    difficultyLevel: 0.5,
    xpGained: xpAwarded,
  }).catch((err) => {
    console.error("Behaviour log on task complete:", err);
  });
  const dateTag = t?.due_date ?? new Date().toISOString().slice(0, 10);
  revalidateTag(`tasks-${user.id}-${dateTag}`, "max");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  if (t?.avoidance_tag === "household" || t?.avoidance_tag === "administration" || t?.avoidance_tag === "social") {
    // Completion → reset skip counter and record completion for this category.
    await recordAvoidanceCompletion(t.avoidance_tag);
  }

  // Snapshot updated Identity Engine reputation for level-up modal.
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
  };
}

/** Mark a task as not done (uncheck). Use if completed by accident. */
export async function uncompleteTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: task } = await supabase.from("tasks").select("due_date").eq("id", id).eq("user_id", user.id).single();
  const { error } = await supabase
    .from("tasks")
    .update({ completed: false, completed_at: null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  const dateTag = (task as { due_date?: string } | null)?.due_date ?? new Date().toISOString().slice(0, 10);
  revalidateTag(`tasks-${user.id}-${dateTag}`, "max");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

/** Restore a soft-deleted task (undo delete). */
export async function restoreTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function getCarryOverCountForDate(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data: tasks } = await supabase
    .from("tasks")
    .select("carry_over_count")
    .eq("user_id", user.id)
    .eq("due_date", date)
    .eq("completed", false)
    .is("parent_task_id", null)
    .is("deleted_at", null);
  const max = Math.max(0, ...(tasks ?? []).map((t) => t.carry_over_count ?? 0));
  return max;
}

export async function snoozeTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: task } = await supabase
    .from("tasks")
    .select("due_date, avoidance_tag")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!task?.due_date) throw new Error("Task not found");
  const tomorrow = new Date(task.due_date + "T12:00:00Z");
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const { error } = await supabase
    .from("tasks")
    .update({ due_date: tomorrowStr })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  const tag = (task as { avoidance_tag?: string | null }).avoidance_tag ?? null;
  if (tag === "household" || tag === "administration" || tag === "social") {
    await incrementAvoidanceSkip(tag);
  }
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function skipNextOccurrence(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: task } = await supabase
    .from("tasks")
    .select("due_date, recurrence_rule, recurrence_weekdays")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  const row = task as { due_date?: string | null; recurrence_rule?: string | null; recurrence_weekdays?: string | null } | null;
  if (!row?.due_date || !row.recurrence_rule) return;

  const nextStr = computeNextRecurrenceDate(row.due_date, row.recurrence_rule, row.recurrence_weekdays ?? null);
  if (!nextStr) return;

  const { error } = await supabase
    .from("tasks")
    .update({ due_date: nextStr, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

export async function getSubtasks(parentTaskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("parent_task_id", parentTaskId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export type SubtaskRow = { id: string; title: string; completed: boolean; created_at: string; parent_task_id: string };

export async function getSubtasksForTaskIds(parentIds: string[]): Promise<SubtaskRow[]> {
  if (parentIds.length === 0) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select("id, title, completed, created_at, parent_task_id")
    .eq("user_id", user.id)
    .in("parent_task_id", parentIds)
    .order("created_at", { ascending: true });
  return (data ?? []) as SubtaskRow[];
}

/** Backlog: onafgevinkte taken met due_date < vandaag of geen datum. */
export async function getBacklogTasks(todayDate: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", false)
    .is("parent_task_id", null)
    .is("deleted_at", null)
    .or(`due_date.is.null,due_date.lt.${todayDate}`)
    .order("due_date", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .limit(100);
  return (data ?? []) as Task[];
}

/** Toekomst: onafgevinkte taken met due_date >= vandaag. */
export async function getFutureTasks(todayDate: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("completed", false)
    .is("parent_task_id", null)
    .is("deleted_at", null)
    .gte("due_date", todayDate)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(100);
  return (data ?? []) as Task[];
}

/** Completed tasks for a given date (top-level only). */
export async function getCompletedTodayTasks(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("due_date", date)
    .eq("completed", true)
    .is("parent_task_id", null)
    .is("deleted_at", null)
    .order("completed_at", { ascending: false });
  return data ?? [];
}

/** Reschedule a task (e.g. from backlog to today). */
export async function rescheduleTask(id: string, due_date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("tasks")
    .update({ due_date })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

/** Update a task (edit modal). */
export async function updateTask(
  id: string,
  params: {
    title?: string;
    due_date?: string;
    category?: "work" | "personal" | null;
    recurrence_rule?: "daily" | "weekly" | "monthly" | null;
    recurrence_weekdays?: string | null;
    impact?: number | null;
    urgency?: number | null;
    energy_required?: number | null;
    focus_required?: number | null;
    mental_load?: number | null;
    social_load?: number | null;
    priority?: number | null;
    notes?: string | null;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const payload: Record<string, unknown> = {};
  if (params.title !== undefined) payload.title = params.title;
  if (params.due_date !== undefined) payload.due_date = params.due_date;
  if (params.category !== undefined) payload.category = params.category;
  if (params.recurrence_rule !== undefined) payload.recurrence_rule = params.recurrence_rule;
  if (params.recurrence_weekdays !== undefined) payload.recurrence_weekdays = params.recurrence_weekdays;
  if (params.impact !== undefined) payload.impact = params.impact;
  if (params.urgency !== undefined) payload.urgency = params.urgency;
  if (params.energy_required !== undefined) payload.energy_required = params.energy_required;
  if (params.focus_required !== undefined) payload.focus_required = params.focus_required;
  if (params.mental_load !== undefined) payload.mental_load = params.mental_load;
  if (params.social_load !== undefined) payload.social_load = params.social_load;
  if (params.priority !== undefined) payload.priority = params.priority;
  if (params.notes !== undefined) payload.notes = params.notes;
  const { error } = await supabase.from("tasks").update(payload).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}

/** Duplicate a task to a given due date (same fields, new id). */
export async function duplicateTask(id: string, due_date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: task } = await supabase
    .from("tasks")
    .select("title, category, recurrence_rule, recurrence_weekdays, impact, urgency, energy_required, focus_required, mental_load, social_load, priority, domain, base_xp")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!task) throw new Error("Task not found");
  const t = task as { title: string; category?: string | null; recurrence_rule?: string | null; recurrence_weekdays?: string | null; impact?: number | null; urgency?: number | null; energy_required?: number | null; focus_required?: number | null; mental_load?: number | null; social_load?: number | null; priority?: number | null; domain?: string | null; base_xp?: number | null };
  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: t.title,
    due_date,
    category: t.category ?? null,
    recurrence_rule: t.recurrence_rule ?? null,
    recurrence_weekdays: t.recurrence_weekdays ?? null,
    impact: t.impact ?? null,
    urgency: t.urgency ?? null,
    energy_required: t.energy_required ?? null,
    focus_required: t.focus_required ?? null,
    mental_load: t.mental_load ?? null,
    social_load: t.social_load ?? null,
    priority: t.priority ?? null,
    domain: t.domain ?? null,
    base_xp: t.base_xp ?? null,
  } as TablesInsert<"tasks">);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
