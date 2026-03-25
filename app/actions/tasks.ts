"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Json, Task, TablesInsert } from "@/types/database.types";
import type { ReputationScore } from "@/lib/identity-engine";
import { isRecoveryTask } from "@/lib/recovery-task";
import { incrementAvoidanceSkip, recordAvoidanceCompletion } from "@/app/actions/avoidance-tracker";
import { trackEvent } from "@/app/actions/analytics-events";
import { revalidatePath, unstable_cache } from "next/cache";
import { revalidateTagMax } from "@/lib/revalidate";
import { classifyTaskPreset, deriveBaseXpFromIntensityDuration } from "@/lib/task-presets";
import { parseMissionProgressionFromTaskTags } from "@/lib/mission-progression";

/** Explicit column list for task reads (avoids select * per SUPABASE_PERFORMANCE_GUIDELINES). */
const TASK_SELECT_COLUMNS =
  "id, user_id, title, due_date, completed, completed_at, carry_over_count, energy_required, priority, notes, created_at, updated_at, parent_task_id, deleted_at, snooze_until, category, impact, domain, cognitive_load, emotional_resistance, mental_load, social_load, focus_required, recurrence_rule, recurrence_weekdays, difficulty, discipline_weight, strategic_value, psychology_label, mission_intent, mission_chain_id, validation_type, base_xp, avoidance_tag, hobby_tag, fatigue_impact, strategy_key_result_id, urgency, task_type, intensity, duration_minutes, task_tags";

export type TaskListMode = "normal" | "low_energy" | "stabilize" | "driven";

/** Request-scoped cache: duplicate getTodaysTasks(date, mode) in the same request return the same result (e.g. dashboard + tasks page). */
export const getTodaysTasks = cache(async (date: string, mode: TaskListMode): Promise<{ tasks: Task[]; carryOverCount: number }> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { tasks: [], carryOverCount: 0 };

  const nowIso = new Date().toISOString();
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT_COLUMNS)
    .eq("user_id", user.id)
    .eq("due_date", date)
    .eq("completed", false)
    .is("parent_task_id", null)
    .is("deleted_at", null)
    .or(`snooze_until.is.null,snooze_until.lt.${nowIso}`);

  if (mode === "low_energy") {
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
    if (mode === "driven") {
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
});

/** Count of tasks completed today (for late-day banner: avoid showing when dashboard cache is stale). */
export async function getCompletedTodayCount(date: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("due_date", date)
    .eq("completed", true)
    .is("deleted_at", null);
  return count ?? 0;
}

export async function getTasksForDate(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("tasks")
    .select(TASK_SELECT_COLUMNS)
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
    .select(TASK_SELECT_COLUMNS)
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
  task_type?: "mental" | "physical" | "mixed" | "recovery" | null;
  intensity?: number | null;
  duration_minutes?: number | null;
  task_tags?: string[] | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je bent niet ingelogd. Log opnieuw in.");

  // High mental load is advisory only: user can always add missions; system may show warnings/locks in the UI.

  const preset = classifyTaskPreset(params.title);
  const inferredBaseXp = deriveBaseXpFromIntensityDuration(preset.intensity, preset.durationMinutes);
  const row: Record<string, unknown> = {
    user_id: user.id,
    title: params.title,
    due_date: params.due_date,
    energy_required: params.energy_required ?? Math.min(10, Math.max(1, Math.round(preset.intensity / 10))),
    focus_required: params.focus_required ?? (preset.type === "mental" ? 7 : preset.type === "mixed" ? 5 : 3),
    mental_load: params.mental_load ?? (preset.type === "mental" ? 8 : preset.type === "mixed" ? 5 : preset.type === "recovery" ? 2 : 3),
    social_load: params.social_load ?? (preset.type === "physical" ? 3 : preset.type === "recovery" ? 2 : 5),
    priority: params.priority ?? null,
    parent_task_id: params.parent_task_id ?? null,
    recurrence_rule: params.recurrence_rule ?? null,
    recurrence_weekdays: params.recurrence_weekdays ?? null,
    category: params.category ?? null,
    impact: params.impact ?? null,
    urgency: params.urgency ?? null,
    notes: params.notes ?? null,
    task_type: params.task_type ?? preset.type,
    intensity: params.intensity ?? preset.intensity,
    duration_minutes: params.duration_minutes ?? preset.durationMinutes,
    task_tags: params.task_tags ?? [],
  };
  if (params.domain != null) row.domain = params.domain;
  else row.domain = preset.domain;
  if (params.cognitive_load != null) row.cognitive_load = params.cognitive_load;
  if (params.emotional_resistance != null) row.emotional_resistance = params.emotional_resistance;
  if (params.discipline_weight != null) row.discipline_weight = params.discipline_weight;
  if (params.strategic_value != null) row.strategic_value = params.strategic_value;
  if (params.psychology_label != null) row.psychology_label = params.psychology_label;
  if (params.mission_intent != null) row.mission_intent = params.mission_intent;
  else row.mission_intent = preset.missionIntent;
  if (params.mission_chain_id != null) row.mission_chain_id = params.mission_chain_id;
  if (params.validation_type != null) row.validation_type = params.validation_type;
  if (params.base_xp != null) row.base_xp = params.base_xp;
  else row.base_xp = Math.max(preset.baseXp, inferredBaseXp);
  if (params.avoidance_tag != null) row.avoidance_tag = params.avoidance_tag;
  if (params.hobby_tag != null) row.hobby_tag = params.hobby_tag;
  else if (preset.hobbyTag) row.hobby_tag = preset.hobbyTag;

  const { data, error } = await supabase
    .from("tasks")
    .insert(row as TablesInsert<"tasks">)
    .select(TASK_SELECT_COLUMNS)
    .single();
  if (error) {
    const msg = error.code === "PGRST301" || error.message?.toLowerCase().includes("auth") || error.message?.toLowerCase().includes("jwt")
      ? "Je sessie is verlopen. Log opnieuw in."
      : error.message?.toLowerCase().includes("unique") || error.message?.toLowerCase().includes("violates")
        ? "Deze taak kon niet worden opgeslagen. Vernieuw de pagina en probeer opnieuw."
        : "De taak kon niet worden toegevoegd. Controleer of je nog bent ingelogd en probeer het opnieuw.";
    throw new Error(msg);
  }
  revalidateTagMax(`tasks-${user.id}-${params.due_date}`);
  revalidateTagMax("decision-blocks");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/xp");
  const task = data as Task;
  return { ok: true as const, id: task?.id, task };
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
  /** Rank ladder (1–100): true when level-up also changed display rank. */
  rankPromotion?: boolean;
  /** New rank title after level-up (e.g. Commander, Dark Commander). */
  newRank?: string;
  /** Previous rank before level-up (for promotion toast). */
  previousRank?: string;
};

function computeNextRecurrenceDate(dueDate: string, recurrenceRule: string | null | undefined, recurrenceWeekdays: string | null | undefined): string | null {
  if (!recurrenceRule) return null;
  const base = new Date(dueDate + "T12:00:00Z");

  if (recurrenceRule === "daily") {
    base.setUTCDate(base.getUTCDate() + 1);
    return base.toISOString().slice(0, 10);
  }

  if (recurrenceRule === "weekly" && recurrenceWeekdays?.trim()) {
    const raw = recurrenceWeekdays.trim();
    const daysPart = raw.includes("days=") ? raw.split("days=")[1].split(";")[0] : raw.split("|")[0];
    const intervalPart = raw.includes("interval=") ? Number(raw.split("interval=")[1].split(/[;|]/)[0]) : 1;
    const intervalWeeks = Number.isFinite(intervalPart) && intervalPart > 1 ? Math.floor(intervalPart) : 1;
    const weekdays = daysPart
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => n >= 1 && n <= 7);
    if (weekdays.length === 0) {
      base.setUTCDate(base.getUTCDate() + 7);
      return base.toISOString().slice(0, 10);
    }
    const currentIso = getISOWeekday(base);
    const sorted = [...weekdays].sort((a, b) => a - b);
    const laterThisCycle = sorted.find((d) => d > currentIso);
    const nextDay = new Date(base);
    if (laterThisCycle != null) {
      nextDay.setUTCDate(nextDay.getUTCDate() + (laterThisCycle - currentIso));
      return nextDay.toISOString().slice(0, 10);
    }
    const firstWeekday = sorted[0] ?? currentIso;
    nextDay.setUTCDate(nextDay.getUTCDate() + intervalWeeks * 7 + (firstWeekday - currentIso));
    return nextDay.toISOString().slice(0, 10);
  }

  if (recurrenceRule === "weekly") {
    base.setUTCDate(base.getUTCDate() + 7);
    return base.toISOString().slice(0, 10);
  }

  if (recurrenceRule === "monthly") {
    if (recurrenceWeekdays?.includes("monthday=")) {
      const monthDay = Number(recurrenceWeekdays.split("monthday=")[1].split(/[;|]/)[0]);
      const d = Number.isFinite(monthDay) ? Math.max(1, Math.min(31, Math.floor(monthDay))) : base.getUTCDate();
      const targetMonth = base.getUTCMonth() + 1;
      const targetYear = base.getUTCFullYear() + Math.floor(targetMonth / 12);
      const monthIdx = targetMonth % 12;
      const lastDay = new Date(Date.UTC(targetYear, monthIdx + 1, 0, 12, 0, 0)).getUTCDate();
      base.setUTCFullYear(targetYear, monthIdx, Math.min(d, lastDay));
      return base.toISOString().slice(0, 10);
    }
    const day = base.getUTCDate();
    base.setUTCMonth(base.getUTCMonth() + 1);
    if (base.getUTCDate() !== day) base.setUTCDate(0);
    return base.toISOString().slice(0, 10);
  }

  return null;
}

export async function completeTask(
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

  const t = task as { recurrence_rule?: string | null; recurrence_weekdays?: string | null; due_date: string; title: string; energy_required?: number | null; focus_required?: number | null; mental_load?: number | null; social_load?: number | null; priority?: number | null; category?: string | null; impact?: number | null; urgency?: number | null; domain?: string | null; discipline_weight?: number | null; base_xp?: number | null; avoidance_tag?: string | null; hobby_tag?: string | null; mission_intent?: string | null; task_type?: string | null; intensity?: number | null; duration_minutes?: number | null; task_tags?: string[] | null } | null;
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
      ? Math.max(
          0,
          Math.round((Date.now() - new Date(options.startedAt).getTime()) / 1000)
        )
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
        task_type: (t.task_type as any) ?? null,
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

  const { logBehaviourEntry } = await import("./dcic/behaviour-log");
  // Map task impact (1–3) to difficulty_level so identity engine impact reputation updates (needs >= 0.7 or xp >= 80).
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
  revalidateTagMax("decision-blocks");

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
    ...(rankPromotion ? { rankPromotion: true, newRank, previousRank } : {}),
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
  revalidateTagMax(`tasks-${user.id}-${dateTag}`);
  const { revalidateDashboardCache } = await import("./dashboard-data");
  revalidateDashboardCache(user.id);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/xp");
  revalidateTagMax("decision-blocks");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: row } = await supabase
    .from("tasks")
    .select("due_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  const dueDate = (row as { due_date?: string } | null)?.due_date;
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  await trackEvent("mission_deleted", { taskId: id });
  if (dueDate) revalidateTagMax(`tasks-${user.id}-${dueDate}`);
  revalidateTagMax("decision-blocks");
  const { revalidateDashboardCache } = await import("./dashboard-data");
  revalidateDashboardCache(user.id);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/xp");
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
  revalidateTagMax("decision-blocks");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/xp");
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
    .select("due_date, recurrence_rule, recurrence_weekdays, avoidance_tag")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!task?.due_date) throw new Error("Task not found");
  const row = task as {
    due_date: string;
    recurrence_rule?: string | null;
    recurrence_weekdays?: string | null;
    avoidance_tag?: string | null;
  };
  const todayStr = todayDateString();
  // Snooze should always move forward from "now" for overdue missions, not from an old due date.
  const baseDate = row.due_date < todayStr ? todayStr : row.due_date;
  const fallbackTomorrow = new Date(baseDate + "T12:00:00Z");
  fallbackTomorrow.setUTCDate(fallbackTomorrow.getUTCDate() + 1);
  const fallbackTomorrowStr = fallbackTomorrow.toISOString().slice(0, 10);
  const nextRecurrence =
    row.recurrence_rule != null
      ? computeNextRecurrenceDate(baseDate, row.recurrence_rule, row.recurrence_weekdays ?? null)
      : null;
  const nextDueDate = nextRecurrence ?? fallbackTomorrowStr;
  const { error } = await supabase
    .from("tasks")
    .update({ due_date: nextDueDate })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  const tag = row.avoidance_tag ?? null;
  if (tag === "household" || tag === "administration" || tag === "social") {
    await incrementAvoidanceSkip(tag);
  }
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/xp");
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
  revalidatePath("/xp");
}

export async function getSubtasks(parentTaskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select(TASK_SELECT_COLUMNS)
    .eq("user_id", user.id)
    .eq("parent_task_id", parentTaskId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export type SubtaskRow = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  parent_task_id: string;
  due_date: string | null;
};

export async function getSubtasksForTaskIds(parentIds: string[]): Promise<SubtaskRow[]> {
  if (parentIds.length === 0) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select("id, title, completed, created_at, parent_task_id, due_date")
    .eq("user_id", user.id)
    .in("parent_task_id", parentIds)
    .order("created_at", { ascending: true });
  return (data ?? []) as SubtaskRow[];
}

/** Max days back for backlog; tasks older than this are excluded. */
const BACKLOG_HORIZON_DAYS = 30;

/** Backlog: onafgevinkte taken met due_date < vandaag of geen datum, max BACKLOG_HORIZON_DAYS terug, nieuwste eerst. */
export async function getBacklogTasks(todayDate: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const cutoffDate = new Date(todayDate + "T12:00:00Z");
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - BACKLOG_HORIZON_DAYS);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("tasks")
    .select(TASK_SELECT_COLUMNS)
    .eq("user_id", user.id)
    .eq("completed", false)
    .is("parent_task_id", null)
    .is("deleted_at", null)
    .or(`due_date.is.null,due_date.lt.${todayDate}`)
    .order("due_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as Task[];
  return rows.filter((t) => {
    const due = (t as { due_date?: string | null }).due_date ?? null;
    return due === null || due >= cutoffStr;
  });
}

/** Toekomst: onafgevinkte taken met due_date na vandaag (niet vandaag). */
export async function getFutureTasks(todayDate: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select(TASK_SELECT_COLUMNS)
    .eq("user_id", user.id)
    .eq("completed", false)
    .is("parent_task_id", null)
    .is("deleted_at", null)
    .gt("due_date", todayDate)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(100);
  return (data ?? []) as Task[];
}

/** Routine tasks: incomplete, top-level, recurrence monthly or weekly (minstens 1x per periode). */
export async function getRoutineTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select(TASK_SELECT_COLUMNS)
    .eq("user_id", user.id)
    .eq("completed", false)
    .is("parent_task_id", null)
    .is("deleted_at", null)
    .in("recurrence_rule", ["daily", "monthly", "weekly"])
    .order("due_date", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .limit(50);
  return (data ?? []) as Task[];
}

/** Routine tasks plus suggested best days in the current week for each (for Routine tab). */
export async function getRoutineTasksWithSuggestions(dateStr: string): Promise<{
  routineTasks: Task[];
  suggestedDays: Record<string, string[]>;
  suggestedPlans: Record<
    string,
    Array<{ date: string; reason: string; priority: "high" | "medium" | "low" }>
  >;
}> {
  const { getWeekBounds } = await import("@/lib/utils/learning");
  const weekStart = getWeekBounds(new Date(dateStr + "T12:00:00Z")).start;
  const [routineTasks, weekLoad] = await Promise.all([
    getRoutineTasks(),
    getWeekPlannedLoad(weekStart),
  ]);
  const { suggestBestDaysForRoutine } = await import("@/lib/routine-suggestions");
  const bestDays = suggestBestDaysForRoutine(weekLoad);
  const suggestedDays: Record<string, string[]> = {};
  const suggestedPlans: Record<
    string,
    Array<{ date: string; reason: string; priority: "high" | "medium" | "low" }>
  > = {};
  for (const t of routineTasks) {
    const recurrence = (t as { recurrence_rule?: string | null }).recurrence_rule ?? "monthly";
    const recurrenceWeekdays = (t as { recurrence_weekdays?: string | null }).recurrence_weekdays ?? null;
    const dueDate = (t as { due_date?: string | null }).due_date ?? null;
    if (recurrence === "weekly" && recurrenceWeekdays?.trim()) {
      const rawWeekdayPart =
        recurrenceWeekdays.split("days=")[1]?.split(";")[0] ?? recurrenceWeekdays.split("|")[0];
      const days = rawWeekdayPart
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => n >= 1 && n <= 7);
      const intervalPart = recurrenceWeekdays.includes("interval=")
        ? Number(recurrenceWeekdays.split("interval=")[1].split(/[;|]/)[0])
        : 1;
      const intervalWeeks = Number.isFinite(intervalPart) && intervalPart > 1 ? Math.floor(intervalPart) : 1;
      const start = new Date(dateStr + "T12:00:00Z");
      const nextCandidates: string[] = [];
      for (let i = 0; i < intervalWeeks * 21; i++) {
        const d = new Date(start);
        d.setUTCDate(start.getUTCDate() + i);
        const isoDay = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
        if (days.includes(isoDay)) {
          if (intervalWeeks > 1) {
            const weekIndex = Math.floor(i / 7);
            if (weekIndex % intervalWeeks !== 0) continue;
          }
          nextCandidates.push(d.toISOString().slice(0, 10));
        }
      }
      suggestedDays[t.id] = nextCandidates.slice(0, 3);
      suggestedPlans[t.id] = nextCandidates.slice(0, 3).map((date, idx) => ({
        date,
        reason: idx === 0 ? "Valt exact op je wekelijkse ritme." : "Back-up moment binnen je weekritme.",
        priority: idx === 0 ? "high" : idx === 1 ? "medium" : "low",
      }));
      continue;
    }
    if (recurrence === "monthly" && dueDate) {
      const monthDay = Number(dueDate.slice(8, 10));
      const now = new Date(dateStr + "T12:00:00Z");
      const nextMonthlyCandidates: string[] = [];
      for (let i = 0; i < 3; i++) {
        const y = now.getUTCFullYear();
        const m = now.getUTCMonth() + i;
        const d = new Date(Date.UTC(y, m, 1, 12, 0, 0));
        const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12, 0, 0)).getUTCDate();
        d.setUTCDate(Math.min(monthDay, lastDay));
        nextMonthlyCandidates.push(d.toISOString().slice(0, 10));
      }
      suggestedDays[t.id] = nextMonthlyCandidates;
      suggestedPlans[t.id] = nextMonthlyCandidates.map((date, idx) => ({
        date,
        reason: idx === 0 ? "Eerstvolgende maandslot voor deze routine." : "Vooruitplannen voor continu ritme.",
        priority: idx === 0 ? "high" : "medium",
      }));
      continue;
    }
    if (recurrence === "daily") {
      const start = new Date(dateStr + "T12:00:00Z");
      const nextThree: string[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(start);
        d.setUTCDate(start.getUTCDate() + i);
        nextThree.push(d.toISOString().slice(0, 10));
      }
      suggestedDays[t.id] = nextThree;
      suggestedPlans[t.id] = nextThree.map((date, idx) => ({
        date,
        reason: idx === 0 ? "Laagste frictie: direct volgende dag." : "Alternatief dagslot voor flexibiliteit.",
        priority: idx === 0 ? "high" : "medium",
      }));
      continue;
    }
    suggestedDays[t.id] = bestDays;
    suggestedPlans[t.id] = bestDays.slice(0, 3).map((date, idx) => ({
      date,
      reason: idx === 0 ? "Beste balans tussen load en focus." : "Alternatief met lage planbelasting.",
      priority: idx === 0 ? "high" : "medium",
    }));
  }
  return { routineTasks, suggestedDays, suggestedPlans };
}

/** Completed tasks for a given date (top-level only). */
export async function getCompletedTodayTasks(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("tasks")
    .select(TASK_SELECT_COLUMNS)
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

  // Capture previous due_date so we can invalidate both old and new task caches.
  let oldDueDate: string | null = null;
  const { data: existing } = await supabase
    .from("tasks")
    .select("due_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (existing) {
    oldDueDate = (existing as { due_date?: string | null }).due_date ?? null;
  }

  const { error } = await supabase
    .from("tasks")
    .update({ due_date })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  // Invalidate cache for the new date (and old date if different).
  revalidateTagMax(`tasks-${user.id}-${due_date}`);
  if (oldDueDate && oldDueDate !== due_date) {
    revalidateTagMax(`tasks-${user.id}-${oldDueDate}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/xp");
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
  let oldDueDate: string | null = null;
  if (params.due_date !== undefined) {
    const { data: existing } = await supabase.from("tasks").select("due_date").eq("id", id).eq("user_id", user.id).single();
    oldDueDate = (existing as { due_date?: string } | null)?.due_date ?? null;
  }
  const { error } = await supabase.from("tasks").update(payload).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  if (params.due_date !== undefined) {
    revalidateTagMax(`tasks-${user.id}-${params.due_date}`);
    if (oldDueDate && oldDueDate !== params.due_date) revalidateTagMax(`tasks-${user.id}-${oldDueDate}`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/xp");
}

/** Duplicate a task to a given due date (same fields, new id). */
export async function duplicateTask(id: string, due_date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: task } = await supabase
    .from("tasks")
    .select("title, category, recurrence_rule, recurrence_weekdays, impact, urgency, energy_required, focus_required, mental_load, social_load, priority, domain, base_xp, task_type, intensity, duration_minutes, task_tags")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!task) throw new Error("Task not found");
  const t = task as { title: string; category?: string | null; recurrence_rule?: string | null; recurrence_weekdays?: string | null; impact?: number | null; urgency?: number | null; energy_required?: number | null; focus_required?: number | null; mental_load?: number | null; social_load?: number | null; priority?: number | null; domain?: string | null; base_xp?: number | null; task_type?: string | null; intensity?: number | null; duration_minutes?: number | null; task_tags?: string[] | null };
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
    task_type: (t.task_type as any) ?? null,
    intensity: t.intensity ?? null,
    duration_minutes: t.duration_minutes ?? null,
    task_tags: t.task_tags ?? [],
  } as TablesInsert<"tasks">);
  if (error) throw new Error(error.message);
  revalidateTagMax(`tasks-${user.id}-${due_date}`);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/xp");
}
