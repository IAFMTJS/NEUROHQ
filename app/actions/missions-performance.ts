"use server";

import { createClient } from "@/lib/supabase/server";
import { getTodaysTasks, type TaskListMode } from "@/app/actions/tasks";
import { getMode } from "@/app/actions/mode";
import { getActiveStrategyFocus } from "@/app/actions/strategyFocus";
import { getPressureIndex } from "@/app/actions/strategyFocus";
import { getAlignmentThisWeek } from "@/app/actions/strategyFocus";
import { isRecoveryTask } from "@/lib/recovery-task";
import { yesterdayDate } from "@/lib/utils/timezone";
/** Task row with optional performance-engine fields (domain, Mission DNA). */
export type TaskWithMeta = {
  id: string;
  title: string | null;
  due_date: string | null;
  completed: boolean;
  energy_required: number | null;
  focus_required: number | null;
  impact: number | null;
  urgency: number | null;
  carry_over_count?: number;
  domain?: string | null;
  cognitive_load?: number | null;
  emotional_resistance?: number | null;
  discipline_weight?: number | null;
  strategic_value?: number | null;
  psychology_label?: string | null;
  mission_intent?: string | null;
  [k: string]: unknown;
};

/** UMS = (StrategyAlignment*0.3) + (CompletionProbability*0.2) + (ROI*0.2) + (EnergyMatch*0.15) + (PressureImpact*0.15) */
export type UnifiedMissionScore = {
  ums: number;
  strategyAlignment: number;
  completionProbability: number;
  roi: number;
  energyMatch: number;
  pressureImpact: number;
};

export type TaskWithUMS = TaskWithMeta & { umsBreakdown: UnifiedMissionScore };

export type DecisionBlock = "streak_critical" | "high_pressure" | "recovery" | "alignment_fix";

export type DecisionBlocksResult = {
  streakCritical: TaskWithMeta[];
  highPressure: TaskWithMeta[];
  recovery: TaskWithMeta[];
  alignmentFix: TaskWithMeta[];
  topRecommendation: TaskWithUMS | null;
  /** Today's tasks sorted by UMS (for mission grid). */
  tasksSortedByUMS: TaskWithUMS[];
  streakAtRisk: boolean;
  pressureZone: "comfort" | "healthy" | "risk";
  alignmentScore: number;
  /** For Add Mission Step 2: Primary (+30%), Secondary (+10%), Outside (-20%). */
  strategyMapping: { primaryDomain: string; secondaryDomains: string[] } | null;
  /** When true, only recovery tasks are shown (load > 80). */
  recoveryOnly?: boolean;
  /** 5+ days no completions; show recovery protocol message. */
  recoveryProtocol?: boolean;
  daysSinceLastCompletion?: number;
};

function strategyAlignmentForTask(
  taskDomain: string | null | undefined,
  primaryDomain: string,
  secondaryDomains: string[]
): number {
  if (!taskDomain) return 0.5;
  if (taskDomain === primaryDomain) return 1;
  if (secondaryDomains.includes(taskDomain)) return 0.6;
  return 0.2; // outside focus
}

function estimateXP(task: TaskWithMeta): number {
  const impact = task.impact ?? 2;
  return Math.max(10, Math.min(100, impact * 35)) || 50;
}

function estimateMinutes(task: TaskWithMeta): number {
  const energy = Math.min(10, Math.max(1, task.energy_required ?? 3));
  return energy * 8; // ~8 min per energy point
}

/** 0–1 ROI score: XP per minute, normalized (e.g. 5 XP/min = 1). */
function roiScore(task: TaskWithMeta): number {
  const xp = estimateXP(task);
  const min = Math.max(1, estimateMinutes(task));
  const xpPerMin = xp / min;
  return Math.min(1, xpPerMin / 5);
}

/** 0–1 energy match: user energy (1–10) vs task energy_required (1–10). */
function energyMatchScore(userEnergy: number, task: TaskWithMeta): number {
  const taskEnergy = Math.min(10, Math.max(1, task.energy_required ?? 5));
  const diff = Math.abs(userEnergy - taskEnergy);
  return Math.max(0, 1 - diff / 5);
}

/** 0–1 pressure impact: high when strategy is under pressure and task is high impact/urgency. */
function pressureImpactScore(
  pressureZone: "comfort" | "healthy" | "risk",
  task: TaskWithMeta
): number {
  if (pressureZone === "comfort") return 0.3;
  const impact = (task.impact ?? 1) / 3;
  const urgency = (task.urgency ?? 1) / 3;
  const taskPressure = (impact + urgency) / 2;
  if (pressureZone === "risk") return 0.4 + taskPressure * 0.6;
  return 0.3 + taskPressure * 0.4;
}

/** Compute UMS for one task. */
function computeUMS(
  task: TaskWithMeta,
  opts: {
    strategyPrimary: string;
    strategySecondary: string[];
    completionRate: number;
    userEnergy: number;
    pressureZone: "comfort" | "healthy" | "risk";
  }
): UnifiedMissionScore {
  const strategyAlignment = strategyAlignmentForTask(
    task.domain,
    opts.strategyPrimary,
    opts.strategySecondary
  );
  let completionProbability = Math.min(1, Math.max(0.2, opts.completionRate));
  const roi = roiScore(task);
  const energyMatch = energyMatchScore(opts.userEnergy, task);
  const pressureImpact = pressureImpactScore(opts.pressureZone, task);

  // Synergy penalty: when energy match is very low, lower completion probability
  // and (lightly) penalize overall score so low-synergy missions drop in ranking.
  if (energyMatch < 0.3) {
    completionProbability = Math.max(0.2, completionProbability - 0.15);
  }

  const ums =
    strategyAlignment * 0.3 +
    completionProbability * 0.2 +
    roi * 0.2 +
    energyMatch * 0.15 +
    pressureImpact * 0.15;

  return {
    ums: Math.round(ums * 100) / 100,
    strategyAlignment,
    completionProbability,
    roi,
    energyMatch,
    pressureImpact,
  };
}

/** Get completion rate per task from task_events (view would need RLS). */
async function getTaskCompletionRates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  taskIds: string[]
): Promise<Record<string, number>> {
  if (taskIds.length === 0) return {};
  const { data: events } = await supabase
    .from("task_events")
    .select("task_id, event_type")
    .eq("user_id", userId)
    .in("task_id", taskIds);
  const byTask: Record<string, { start: number; complete: number; abandon: number }> = {};
  for (const e of events ?? []) {
    const r = e as { task_id: string; event_type: string };
    if (!byTask[r.task_id]) byTask[r.task_id] = { start: 0, complete: 0, abandon: 0 };
    if (r.event_type === "start") byTask[r.task_id].start++;
    else if (r.event_type === "complete") byTask[r.task_id].complete++;
    else if (r.event_type === "abandon") byTask[r.task_id].abandon++;
  }
  const out: Record<string, number> = {};
  for (const taskId of taskIds) {
    const t = byTask[taskId];
    if (!t) {
      out[taskId] = 0.7;
      continue;
    }
    const attempts = t.start + t.complete + t.abandon;
    out[taskId] = attempts > 0 ? Math.min(1, Math.max(0.2, t.complete / attempts)) : 0.7;
  }
  return out;
}

/** Decision Engine: UMS-scored tasks + decision blocks (streak critical, high pressure, recovery, alignment fix). */
export async function getDecisionBlocks(dateStr: string): Promise<DecisionBlocksResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      streakCritical: [],
      highPressure: [],
      recovery: [],
      alignmentFix: [],
      topRecommendation: null,
      tasksSortedByUMS: [],
      streakAtRisk: false,
      pressureZone: "comfort",
      alignmentScore: 1,
      strategyMapping: null,
    };
  }

  const { getConsequenceState } = await import("./consequence-engine");

  const mode = await getMode(dateStr);
  const taskMode: TaskListMode =
    mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks: rawTasks } = await getTodaysTasks(dateStr, taskMode);
  let tasks = (rawTasks ?? []) as TaskWithMeta[];

  const consequenceState = await getConsequenceState(dateStr);
  if (consequenceState.recoveryOnly) {
    tasks = tasks.filter((t) => isRecoveryTask(t));
  }

  const yesterdayStr = yesterdayDate(dateStr);
  const strategy = await getActiveStrategyFocus();
  const [pressureResult, alignmentWeek, streakRow, dailyState] = await Promise.all([
    strategy ? getPressureIndex(strategy.id) : Promise.resolve({ pressure: 0, zone: "comfort" as const, daysRemaining: 0, targetRemaining: 0 }),
    strategy ? getAlignmentThisWeek(strategy.id) : Promise.resolve({ planned: {}, actual: {}, alignmentScore: 1 }),
    supabase.from("user_streak").select("last_completion_date").eq("user_id", user.id).single(),
    supabase.from("daily_state").select("energy").eq("user_id", user.id).eq("date", dateStr).single(),
  ]);

  const lastCompletion = (streakRow.data as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;
  const streakAtRisk = lastCompletion !== yesterdayStr && lastCompletion !== dateStr;
  const pressureZone = pressureResult.zone;
  const alignmentScore = "alignmentScore" in alignmentWeek ? alignmentWeek.alignmentScore : 1;
  const userEnergy = (dailyState.data as { energy?: number } | null)?.energy ?? 5;
  const strategyPrimary = strategy?.primary_domain ?? "discipline";
  const strategySecondary = strategy?.secondary_domains ?? [];

  const completionRates = await getTaskCompletionRates(
    supabase,
    user.id,
    tasks.map((t) => t.id)
  );

  const withUMS: TaskWithUMS[] = tasks.map((t) => {
    const breakdown = computeUMS(t, {
      strategyPrimary,
      strategySecondary,
      completionRate: completionRates[t.id] ?? 0.7,
      userEnergy,
      pressureZone,
    });
    return { ...t, umsBreakdown: breakdown };
  });

  withUMS.sort((a, b) => b.umsBreakdown.ums - a.umsBreakdown.ums);
  const topRecommendation = withUMS[0] ?? null;

  const streakCritical: TaskWithMeta[] = streakAtRisk ? tasks.slice(0, 2) : [];
  const highPressure: TaskWithMeta[] =
    pressureZone === "risk" || pressureZone === "healthy"
      ? tasks.filter((t) => ((t.urgency ?? 0) >= 2 || (t.impact ?? 0) >= 2)).slice(0, 4)
      : [];
  const recovery: TaskWithMeta[] = tasks.filter((t) => (t.energy_required ?? 5) <= 3).slice(0, 3);
  const alignmentFix: TaskWithMeta[] =
    alignmentScore < 0.7 && strategy
      ? tasks.filter((t) => t.domain === strategy.primary_domain).slice(0, 3)
      : [];

  return {
    streakCritical,
    highPressure,
    recovery,
    alignmentFix,
    topRecommendation,
    tasksSortedByUMS: withUMS,
    streakAtRisk,
    pressureZone,
    alignmentScore,
    strategyMapping: strategy
      ? { primaryDomain: strategy.primary_domain, secondaryDomains: strategy.secondary_domains }
      : null,
    recoveryOnly: consequenceState.recoveryOnly,
    recoveryProtocol: consequenceState.recoveryProtocol,
    daysSinceLastCompletion: consequenceState.daysSinceLastCompletion,
  };
}

/** Week data for Calendar Modal 3.0: time budget, strategy allocation, pressure. */
export async function getCalendarWeekData(weekStartStr: string): Promise<{
  days: (import("@/app/actions/tasks").DayPlannedLoad & { distributionWarning?: boolean })[];
  strategy: { weeklyAllocation: Record<string, number>; primaryDomain: string } | null;
  pressure: { zone: "comfort" | "healthy" | "risk"; daysRemaining: number };
  todayStr: string;
}> {
  const { getWeekPlannedLoad } = await import("@/app/actions/tasks");
  const strategy = await getActiveStrategyFocus();
  const rawDays = await getWeekPlannedLoad(weekStartStr);
  const totalWeekMinutes = rawDays.reduce((s, d) => s + (d.totalPlannedMinutes ?? d.totalEnergy * 8), 0);
  const avgMinutes = rawDays.length ? totalWeekMinutes / rawDays.length : 0;
  const days = rawDays.map((d) => ({
    ...d,
    distributionWarning: avgMinutes > 0 && (d.totalPlannedMinutes ?? d.totalEnergy * 8) > avgMinutes * 1.5,
  }));
  const pressure = strategy ? await getPressureIndex(strategy.id) : { zone: "comfort" as const, daysRemaining: 0 };
  const todayStr = new Date().toISOString().slice(0, 10);
  return {
    days,
    strategy: strategy
      ? {
          weeklyAllocation: strategy.weekly_allocation as Record<string, number>,
          primaryDomain: strategy.primary_domain,
        }
      : null,
    pressure: { zone: pressure.zone, daysRemaining: pressure.daysRemaining },
    todayStr,
  };
}

/** Friction Alert: average completion rate for tasks similar to given DNA (cognitive_load, energy, domain). */
export async function getSimilarTasksCompletionRate(params: {
  cognitiveLoad?: number;
  energyRequired?: number;
  domain?: string | null;
}): Promise<{ rate: number; count: number; message: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { rate: 0.7, count: 0, message: null };

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, cognitive_load, energy_required, domain")
    .eq("user_id", user.id)
    .is("deleted_at", null);
  if (!tasks?.length) return { rate: 0.7, count: 0, message: null };

  const c = params.cognitiveLoad ?? 0.5;
  const e = params.energyRequired ?? 4;
  const d = params.domain ?? null;
  const similar = (tasks as { id: string; cognitive_load?: number | null; energy_required?: number | null; domain?: string | null }[]).filter(
    (t) => {
      const tc = t.cognitive_load ?? 0.5;
      const te = t.energy_required ?? 4;
      const td = t.domain ?? null;
      const matchDomain = !d || !td || d === td;
      const matchCognitive = Math.abs(tc - c) <= 0.3;
      const matchEnergy = Math.abs((te ?? 0) - e) <= 2;
      return matchDomain && (matchCognitive || matchEnergy);
    }
  );
  const taskIds = similar.map((t) => t.id);
  if (taskIds.length === 0) return { rate: 0.7, count: 0, message: null };

  const completionRates = await getTaskCompletionRates(supabase, user.id, taskIds);
  const rates = Object.values(completionRates).filter((r) => r !== 0.7);
  const count = rates.length;
  const rate = count > 0 ? rates.reduce((a, b) => a + b, 0) / count : 0.7;
  const message =
    count >= 3 && rate < 0.5
      ? `Gelijkaardige missies hadden lage completion rate (${Math.round(rate * 100)}%). Overweeg lichtere of kortere missies.`
      : null;
  return { rate, count, message };
}

/** Resistance Index: hesitation time, abandon rate, comfort bias → message e.g. "Je vermijdt hoge cognitieve missies." */
export async function getResistanceIndex(): Promise<{
  message: string | null;
  hesitationAvgSeconds: number | null;
  abandonRate: number;
  highCognitiveAvoidance: boolean;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: null, hesitationAvgSeconds: null, abandonRate: 0, highCognitiveAvoidance: false };

  const { data: events } = await supabase
    .from("task_events")
    .select("task_id, event_type, duration_before_start_seconds")
    .eq("user_id", user.id);
  if (!events?.length) return { message: null, hesitationAvgSeconds: null, abandonRate: 0, highCognitiveAvoidance: false };

  const starts = events.filter((e: { event_type: string }) => e.event_type === "start");
  const completes = events.filter((e: { event_type: string }) => e.event_type === "complete");
  const abandons = events.filter((e: { event_type: string }) => e.event_type === "abandon");
  const hesitationSum = starts.reduce((a: number, e: { duration_before_start_seconds?: number | null }) => a + (e.duration_before_start_seconds ?? 0), 0);
  const hesitationAvgSeconds = starts.length > 0 ? Math.round(hesitationSum / starts.length) : null;
  const attempts = completes.length + abandons.length;
  const abandonRate = attempts > 0 ? abandons.length / attempts : 0;

  const taskIds = [...new Set(events.map((e: { task_id: string }) => e.task_id))];
  const { data: tasks } = await supabase.from("tasks").select("id, cognitive_load").in("id", taskIds);
  const completedIds = new Set(events.filter((e: { event_type: string }) => e.event_type === "complete").map((e: { task_id: string }) => e.task_id));
  const abandonedIds = new Set(events.filter((e: { event_type: string }) => e.event_type === "abandon").map((e: { task_id: string }) => e.task_id));
  const highCognitiveCompleted = (tasks ?? []).filter((t: { cognitive_load?: number | null }) => (t.cognitive_load ?? 0) >= 0.7 && completedIds.has((t as { id: string }).id));
  const highCognitiveAbandoned = (tasks ?? []).filter((t: { cognitive_load?: number | null }) => (t.cognitive_load ?? 0) >= 0.7 && abandonedIds.has((t as { id: string }).id));
  const highCognitiveAvoidance = highCognitiveAbandoned.length > highCognitiveCompleted.length && (highCognitiveAbandoned.length + highCognitiveCompleted.length) >= 2;

  let message: string | null = null;
  if (highCognitiveAvoidance) message = "Je vermijdt hoge cognitieve missies.";
  else if (abandonRate >= 0.4 && attempts >= 3) message = "Veel missies worden niet afgerond. Overweeg kortere of lichtere missies.";
  else if (hesitationAvgSeconds != null && hesitationAvgSeconds > 300) message = "Je twijfelt lang voordat je start. Kleine eerste stap kan helpen.";

  return { message, hesitationAvgSeconds, abandonRate, highCognitiveAvoidance };
}

/** Meta 30 days: biggest sabotage pattern, most effective type, comfortzone score, growth per domain. */
export async function getMetaInsights30(): Promise<{
  biggestSabotagePattern: string | null;
  mostEffectiveType: string | null;
  comfortzoneScore: number;
  growthPerDomain: Record<string, number>;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { biggestSabotagePattern: null, mostEffectiveType: null, comfortzoneScore: 0.5, growthPerDomain: {} };

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: events } = await supabase
    .from("task_events")
    .select("task_id, event_type")
    .eq("user_id", user.id)
    .gte("occurred_at", sinceStr);
  const taskIds = [...new Set((events ?? []).map((e: { task_id: string }) => e.task_id))];
  const { data: tasks } = taskIds.length
    ? await supabase.from("tasks").select("id, domain, cognitive_load, energy_required").in("id", taskIds)
    : { data: [] };
  const completed = (events ?? []).filter((e: { event_type: string }) => e.event_type === "complete");
  const abandoned = (events ?? []).filter((e: { event_type: string }) => e.event_type === "abandon");
  const abandonRate = completed.length + abandoned.length > 0 ? abandoned.length / (completed.length + abandoned.length) : 0;

  let biggestSabotagePattern: string | null = null;
  if (abandonRate >= 0.4) biggestSabotagePattern = "Veel missies niet afgerond (abandon).";
  else if (abandoned.length > completed.length) biggestSabotagePattern = "Meer missies gestart dan voltooid.";

  const byDomain: Record<string, { complete: number; total: number }> = {};
  for (const e of events ?? []) {
    const t = (tasks ?? []).find((x: { id: string }) => x.id === (e as { task_id: string }).task_id) as { domain?: string | null } | undefined;
    const d = t?.domain ?? "other";
    if (!byDomain[d]) byDomain[d] = { complete: 0, total: 0 };
    byDomain[d].total++;
    if ((e as { event_type: string }).event_type === "complete") byDomain[d].complete++;
  }
  const growthPerDomain: Record<string, number> = {};
  for (const [d, v] of Object.entries(byDomain)) {
    growthPerDomain[d] = v.total > 0 ? v.complete / v.total : 0.5;
  }
  const comfortzoneScore = tasks?.length
    ? (tasks as { cognitive_load?: number | null; energy_required?: number | null }[]).reduce((a, t) => a + ((t.cognitive_load ?? 0.5) + ((t.energy_required ?? 5) / 10)) / 2, 0) / tasks.length
    : 0.5;
  const mostEffectiveType = completed.length > abandoned.length ? "Tijd gebaseerd / korte sessies" : null;

  return { biggestSabotagePattern, mostEffectiveType, comfortzoneScore, growthPerDomain };
}

/** 7 days inactive → Recovery Campaign: suggest 3 micro missions, momentum rebuild, low pressure. */
export async function getRecoveryCampaignNeeded(): Promise<{
  needed: boolean;
  lastCompletionDate: string | null;
  daysInactive: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { needed: false, lastCompletionDate: null, daysInactive: 0 };

  const todayStr = new Date().toISOString().slice(0, 10);

  let lastCompletion: string | null = null;
  const { data: streak } = await supabase.from("user_streak").select("last_completion_date").eq("user_id", user.id).single();
  lastCompletion = (streak as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;

  if (!lastCompletion) {
    const { data: lastTask } = await supabase
      .from("tasks")
      .select("completed_at")
      .eq("user_id", user.id)
      .eq("completed", true)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();
    if (lastTask && (lastTask as { completed_at: string }).completed_at)
      lastCompletion = (lastTask as { completed_at: string }).completed_at.slice(0, 10);
  }

  if (!lastCompletion) return { needed: true, lastCompletionDate: null, daysInactive: 7 };

  const last = new Date(lastCompletion + "T12:00:00Z");
  const today = new Date(todayStr + "T12:00:00Z");
  const daysInactive = Math.max(0, Math.floor((today.getTime() - last.getTime()) / 86400000));
  return { needed: daysInactive >= 7, lastCompletionDate: lastCompletion, daysInactive };
}

/** Auto-Scheduler: suggest task moves to balance energy across the week. */
export async function getAutoScheduleSuggestions(weekStartStr: string): Promise<{
  suggestions: { taskId: string; taskTitle: string; currentDue: string; suggestedDue: string; reason: string }[];
  message: string;
}> {
  const { getWeekPlannedLoad } = await import("@/app/actions/tasks");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { suggestions: [], message: "Niet ingelogd." };

  const days = await getWeekPlannedLoad(weekStartStr);
  const overloaded = days.filter((d) => d.isOverload || d.totalEnergy >= 8);
  const light = days.filter((d) => d.totalEnergy <= 3 && d.taskCount < 3);
  if (overloaded.length === 0 || light.length === 0) return { suggestions: [], message: "Week is al redelijk in balans." };

  const overloadedDates = overloaded.map((d) => d.date);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, energy_required")
    .eq("user_id", user.id)
    .eq("completed", false)
    .is("deleted_at", null)
    .in("due_date", overloadedDates);
  if (!tasks?.length) return { suggestions: [], message: "Geen taken om te verplaatsen." };

  const suggestions: { taskId: string; taskTitle: string; currentDue: string; suggestedDue: string; reason: string }[] = [];
  const lightDates = light.map((d) => d.date);
  for (let i = 0; i < Math.min(tasks.length, lightDates.length); i++) {
    const t = tasks[i] as { id: string; title: string | null; due_date: string | null };
    suggestions.push({
      taskId: t.id,
      taskTitle: t.title ?? "Task",
      currentDue: t.due_date ?? "",
      suggestedDue: lightDates[i],
      reason: "Betere spreiding van energy load",
    });
  }
  return {
    suggestions,
    message: suggestions.length > 0 ? `${suggestions.length} taak(s) verplaatsen voor betere balans.` : "Geen suggesties.",
  };
}

/** Emotional state correlations: completion rate per state, e.g. "Je completion rate blijft 72% zelfs als je moe bent". */
export async function getEmotionalStateCorrelations(): Promise<{
  message: string | null;
  byState: Record<string, { completed: number; total: number; rate: number }>;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const empty = { message: null, byState: {} };
  if (!user) return empty;

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: events } = await supabase
    .from("task_events")
    .select("event_type, occurred_at")
    .eq("user_id", user.id)
    .in("event_type", ["complete", "abandon"])
    .gte("occurred_at", sinceStr);
  if (!events?.length) return empty;

  const dates = [...new Set((events as { occurred_at: string }[]).map((e) => e.occurred_at.slice(0, 10)))];
  const { data: dailyRows } = await supabase
    .from("daily_state")
    .select("date, emotional_state")
    .eq("user_id", user.id)
    .in("date", dates);
  const stateByDate = new Map<string, string>();
  for (const r of dailyRows ?? []) {
    const s = (r as { emotional_state?: string | null }).emotional_state;
    if (s) stateByDate.set((r as { date: string }).date, s);
  }

  const byState: Record<string, { completed: number; total: number }> = {};
  for (const e of events as { event_type: string; occurred_at: string }[]) {
    const date = e.occurred_at.slice(0, 10);
    const state = stateByDate.get(date) ?? "unknown";
    if (!byState[state]) byState[state] = { completed: 0, total: 0 };
    byState[state].total++;
    if (e.event_type === "complete") byState[state].completed++;
  }
  const labels: Record<string, string> = { focused: "gefocust", tired: "moe", resistance: "weerstand", distracted: "afgeleid", motivated: "gemotiveerd", unknown: "onbekend" };
  const byStateRates: Record<string, { completed: number; total: number; rate: number }> = {};
  for (const [state, v] of Object.entries(byState)) {
    if (v.total < 3) continue;
    byStateRates[state] = { ...v, rate: v.total > 0 ? v.completed / v.total : 0 };
  }
  const entries = Object.entries(byStateRates).filter(([, v]) => v.total >= 3);
  if (entries.length < 2) return { message: null, byState: byStateRates };
  const worst = entries.reduce((a, b) => (a[1].rate <= b[1].rate ? a : b));
  const pct = Math.round(worst[1].rate * 100);
  const label = labels[worst[0]] ?? worst[0];
  const message = `Je completion rate blijft ${pct}% zelfs als je ${label} bent.`;
  return { message, byState: byStateRates };
}

/** Get today's tasks sorted by UMS (for mission grid). */
export async function getTasksSortedByUMS(dateStr: string): Promise<TaskWithUMS[]> {
  const { topRecommendation, streakAtRisk, pressureZone, alignmentScore } = await getDecisionBlocks(dateStr);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const mode = await getMode(dateStr);
  const taskMode: TaskListMode =
    mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks: rawTasks } = await getTodaysTasks(dateStr, taskMode);
  const tasks = (rawTasks ?? []) as TaskWithMeta[];

  const strategy = await getActiveStrategyFocus();
  const pressureResult = strategy ? await getPressureIndex(strategy.id) : { zone: "comfort" as const };
  const dailyState = await supabase.from("daily_state").select("energy").eq("user_id", user.id).eq("date", dateStr).single();
  const userEnergy = (dailyState.data as { energy?: number } | null)?.energy ?? 5;
  const completionRates = await getTaskCompletionRates(supabase, user.id, tasks.map((t) => t.id));

  const withUMS: TaskWithUMS[] = tasks.map((t) => {
    const breakdown = computeUMS(t, {
      strategyPrimary: strategy?.primary_domain ?? "discipline",
      strategySecondary: strategy?.secondary_domains ?? [],
      completionRate: completionRates[t.id] ?? 0.7,
      userEnergy,
      pressureZone: pressureResult.zone,
    });
    return { ...t, umsBreakdown: breakdown };
  });

  withUMS.sort((a, b) => b.umsBreakdown.ums - a.umsBreakdown.ums);
  return withUMS;
}

import { addXP } from "@/app/actions/xp";
import { updateStreakOnTaskComplete } from "@/app/actions/streak";

const BUDGET_MISSION_XP: Record<"safe_spend" | "log_all" | "no_impulse", number> = {
  safe_spend: 20,
  log_all: 10,
  no_impulse: 15,
};

async function getBudgetXpMultiplier(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 1;
    const { data } = await supabase
      .from("user_skills")
      .select("skill_key")
      .eq("user_id", user.id);
    const skills = (data ?? []) as { skill_key: string }[];
    const hasBudgetMastery = skills.some((s) => s.skill_key === "budget_mastery");
    return hasBudgetMastery ? 1.05 : 1;
  } catch {
    return 1;
  }
}

/** Hook for budget discipline missions (safe spend, logging, impulse control).
 *  Awards XP and updates the global streak so budget behavior feeds into progression.
 */
export async function recordBudgetDisciplineMission(params: {
  mission: "safe_spend" | "log_all" | "no_impulse";
}): Promise<{ ok: boolean }> {
  const today = new Date().toISOString().slice(0, 10);
  const baseXp = BUDGET_MISSION_XP[params.mission] ?? 10;
  const mult = await getBudgetXpMultiplier();
  const xp = Math.round(baseXp * mult);

  await Promise.all([
    addXP(xp, { source_type: "budget_discipline" }),
    updateStreakOnTaskComplete(today),
  ]);

  return { ok: true };
}
