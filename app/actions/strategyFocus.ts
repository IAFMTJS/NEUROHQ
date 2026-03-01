"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  DOMAINS,
  alignmentScore,
  distributionFractions,
  type StrategyDomain,
  type WeeklyAllocation,
} from "@/lib/strategyDomains";

export type StrategyFocusRow = {
  id: string;
  user_id: string;
  thesis: string;
  thesis_why: string | null;
  deadline: string;
  target_metric: string | null;
  primary_domain: StrategyDomain;
  secondary_domains: string[];
  weekly_allocation: WeeklyAllocation;
  phase: "accumulation" | "intensification" | "optimization" | "stabilization";
  identity_profile: "commander" | "builder" | "operator" | "athlete" | "scholar";
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  archive_reason: string | null;
  archive_reason_note: string | null;
  created_at: string;
  updated_at: string;
};

export type AlignmentLogRow = {
  id: string;
  strategy_id: string;
  date: string;
  planned_distribution: Record<string, number>;
  actual_distribution: Record<string, number>;
  alignment_score: number;
};

export type StrategyReviewRow = {
  id: string;
  strategy_id: string;
  week_number: number;
  week_start: string;
  alignment_score: number | null;
  biggest_drift_domain: string | null;
  strongest_domain: string | null;
  notes: string | null;
  created_at: string;
};

const DEFAULT_ALLOCATION: WeeklyAllocation = {
  discipline: 25,
  health: 25,
  learning: 25,
  business: 25,
};

function normalizeAllocation(wa: Record<string, unknown> | null): WeeklyAllocation {
  if (!wa || typeof wa !== "object") return { ...DEFAULT_ALLOCATION };
  const out = { ...DEFAULT_ALLOCATION };
  for (const d of DOMAINS) {
    const v = wa[d];
    if (typeof v === "number" && v >= 0 && v <= 100) out[d] = Math.round(v);
  }
  const sum = Object.values(out).reduce((a, b) => a + b, 0);
  if (sum !== 100 && sum > 0) {
    const scale = 100 / sum;
    for (const d of DOMAINS) out[d] = Math.round(out[d] * scale);
  }
  return out;
}

/** Get active strategy focus for current user. */
export async function getActiveStrategyFocus(): Promise<StrategyFocusRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("strategy_focus")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!data) return null;
  return {
    ...data,
    secondary_domains: Array.isArray(data.secondary_domains) ? data.secondary_domains : [],
    weekly_allocation: normalizeAllocation(data.weekly_allocation as Record<string, unknown>),
  } as StrategyFocusRow;
}

/** Upsert active strategy focus (creates or updates; only one active). */
export async function upsertStrategyFocus(params: {
  thesis: string;
  thesis_why?: string | null;
  deadline: string;
  target_metric?: string | null;
  primary_domain: StrategyDomain;
  secondary_domains?: string[];
  weekly_allocation?: Partial<WeeklyAllocation>;
  phase?: StrategyFocusRow["phase"];
  identity_profile?: StrategyFocusRow["identity_profile"];
  start_date?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const allocation: WeeklyAllocation = {
    ...DEFAULT_ALLOCATION,
    ...normalizeAllocation(params.weekly_allocation ?? {}),
  };
  const sum = Object.values(allocation).reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    const scale = 100 / sum;
    for (const d of DOMAINS) allocation[d] = Math.round(allocation[d] * scale);
  }

  const { data: existing } = await supabase
    .from("strategy_focus")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  const payload = {
    user_id: user.id,
    thesis: params.thesis.trim(),
    thesis_why: params.thesis_why?.trim() ?? null,
    deadline: params.deadline,
    target_metric: params.target_metric?.trim() ?? null,
    primary_domain: params.primary_domain,
    secondary_domains: params.secondary_domains ?? [],
    weekly_allocation: allocation,
    phase: params.phase ?? "accumulation",
    identity_profile: params.identity_profile ?? "operator",
    start_date: params.start_date ?? new Date().toISOString().slice(0, 10),
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  let result: { error: { message: string } | null };
  if (existing?.id) {
    result = await supabase.from("strategy_focus").update(payload).eq("id", existing.id).eq("user_id", user.id);
  } else {
    result = await supabase.from("strategy_focus").insert(payload);
  }
  if (result.error) {
    const msg = result.error.message;
    if (msg.includes("relation") || msg.includes("does not exist") || msg.includes("PGRST")) {
      throw new Error(
        "Strategie-tabellen ontbreken. Voer de migraties uit in Supabase SQL Editor (zie DEPLOY.md) en controleer NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."
      );
    }
    throw new Error(msg || "Kon strategie niet opslaan.");
  }
  revalidatePath("/strategy");
  revalidatePath("/dashboard");
}

export type ArchiveReason = "target_met" | "alignment_ok" | "alignment_fail" | "custom";

/** Set active strategy to inactive (archive) with optional reason and note. */
export async function archiveStrategyFocus(
  strategyId: string,
  reason?: ArchiveReason | null,
  note?: string | null
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase
    .from("strategy_focus")
    .update({
      is_active: false,
      end_date: new Date().toISOString().slice(0, 10),
      archive_reason: reason ?? null,
      archive_reason_note: note?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", strategyId)
    .eq("user_id", user.id);
  revalidatePath("/strategy");
  revalidatePath("/dashboard");
}

/** Get past (archived) strategy focus list. */
export async function getPastStrategyFocus(limit = 10): Promise<StrategyFocusRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("strategy_focus")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", false)
    .order("end_date", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({
    ...r,
    secondary_domains: Array.isArray(r.secondary_domains) ? r.secondary_domains : [],
    weekly_allocation: normalizeAllocation(r.weekly_allocation as Record<string, unknown>),
    archive_reason: (r as { archive_reason?: string | null }).archive_reason ?? null,
    archive_reason_note: (r as { archive_reason_note?: string | null }).archive_reason_note ?? null,
  })) as StrategyFocusRow[];
}

/** Update weekly allocation for active strategy. */
export async function updateWeeklyAllocation(allocation: Partial<WeeklyAllocation>): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: row } = await supabase
    .from("strategy_focus")
    .select("id, weekly_allocation")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();
  if (!row) return;
  const current = normalizeAllocation(row.weekly_allocation as Record<string, unknown>);
  const next: WeeklyAllocation = { ...current, ...allocation };
  const sum = Object.values(next).reduce((a, b) => a + b, 0);
  if (sum !== 100 && sum > 0) {
    const scale = 100 / sum;
    for (const d of DOMAINS) next[d] = Math.round(next[d] * scale);
  }
  await supabase
    .from("strategy_focus")
    .update({ weekly_allocation: next, updated_at: new Date().toISOString() })
    .eq("id", row.id);
  revalidatePath("/strategy");
}

/** Estimate XP for a completed task (same formula as missions-performance / TaskDetailsModal). */
function estimateXPFromTask(impact: number | null | undefined): number {
  const i = impact ?? 2;
  return Math.max(10, Math.min(100, i * 35)) || 50;
}

/** XP per domain for a date range. Includes behaviour_log + missions (DCIC) and completed tasks (Missions page). */
export async function getXPByDomain(startDate: string, endDate: string): Promise<Record<StrategyDomain, number>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { discipline: 0, health: 0, learning: 0, business: 0 };

  const out: Record<string, number> = { discipline: 0, health: 0, learning: 0, business: 0 };

  const startTs = startDate + "T00:00:00.000Z";
  const endTs = endDate + "T23:59:59.999Z";

  const { data: completedTasks } = await supabase
    .from("tasks")
    .select("domain, impact")
    .eq("user_id", user.id)
    .eq("completed", true)
    .not("completed_at", "is", null)
    .gte("completed_at", startTs)
    .lte("completed_at", endTs);

  for (const t of completedTasks ?? []) {
    const r = t as { domain?: string | null; impact?: number | null };
    const domain = r.domain;
    if (domain && DOMAINS.includes(domain as StrategyDomain)) {
      out[domain] = (out[domain] ?? 0) + estimateXPFromTask(r.impact);
    }
  }

  const { data: logs } = await supabase
    .from("behaviour_log")
    .select("mission_id, xp_gained")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .not("mission_id", "is", null)
    .not("xp_gained", "is", null);

  if (logs?.length) {
    const missionIds = [...new Set((logs as { mission_id: string }[]).map((l) => l.mission_id).filter(Boolean))];
    const { data: missions } = await supabase
      .from("missions")
      .select("id, domain")
      .in("id", missionIds);
    const domainByMission: Record<string, string> = {};
    for (const m of missions ?? []) {
      const d = (m as { domain?: string }).domain;
      if (d && DOMAINS.includes(d as StrategyDomain)) domainByMission[m.id] = d;
    }
    for (const log of logs as { mission_id: string; xp_gained: number }[]) {
      const xp = log.xp_gained ?? 0;
      const domain = domainByMission[log.mission_id];
      if (domain && out[domain] !== undefined) out[domain] += xp;
    }
  }

  return out as Record<StrategyDomain, number>;
}

/** Get or compute alignment log for a given date. */
export async function getAlignmentForDate(strategyId: string, date: string): Promise<AlignmentLogRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("alignment_log")
    .select("*")
    .eq("strategy_id", strategyId)
    .eq("date", date)
    .single();
  if (data) {
    return {
      ...data,
      planned_distribution: (data.planned_distribution as Record<string, number>) ?? {},
      actual_distribution: (data.actual_distribution as Record<string, number>) ?? {},
      alignment_score: Number(data.alignment_score),
    };
  }
  return null;
}

/** Get alignment log for last N days. */
export async function getAlignmentLog(strategyId: string, days = 14): Promise<AlignmentLogRow[]> {
  const supabase = await createClient();
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const { data } = await supabase
    .from("alignment_log")
    .select("*")
    .eq("strategy_id", strategyId)
    .gte("date", start.toISOString().slice(0, 10))
    .lte("date", end.toISOString().slice(0, 10))
    .order("date", { ascending: false });
  return (data ?? []).map((r) => ({
    ...r,
    planned_distribution: (r.planned_distribution as Record<string, number>) ?? {},
    actual_distribution: (r.actual_distribution as Record<string, number>) ?? {},
    alignment_score: Number(r.alignment_score),
  })) as AlignmentLogRow[];
}

/** Compute and store alignment for a date (planned from strategy, actual from XP by domain). */
export async function computeAndUpsertAlignment(strategyId: string, date: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: strategy } = await supabase
    .from("strategy_focus")
    .select("weekly_allocation")
    .eq("id", strategyId)
    .single();
  if (!strategy) return;

  const planned = distributionFractions(normalizeAllocation(strategy.weekly_allocation as Record<string, unknown>));
  const xpByDomain = await getXPByDomain(date, date);
  const totalXP = Object.values(xpByDomain).reduce((a, b) => a + b, 0);
  const actual: Record<string, number> = {};
  if (totalXP > 0) {
    for (const d of DOMAINS) actual[d] = (xpByDomain[d] ?? 0) / totalXP;
  } else {
    for (const d of DOMAINS) actual[d] = 0.25;
  }
  const score = alignmentScore(planned, actual);

  await supabase.from("alignment_log").upsert(
    {
      strategy_id: strategyId,
      date,
      planned_distribution: planned,
      actual_distribution: actual,
      alignment_score: score,
    },
    { onConflict: "strategy_id,date" }
  );
  revalidatePath("/strategy");
}

/** Momentum per domain: XP_last_7 / XP_previous_7 (ratio). */
export async function getMomentumByDomain(): Promise<Record<StrategyDomain, number>> {
  const end = new Date();
  const mid = new Date();
  mid.setDate(mid.getDate() - 7);
  const start = new Date();
  start.setDate(start.getDate() - 14);
  const last7 = await getXPByDomain(mid.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
  const prev7 = await getXPByDomain(start.toISOString().slice(0, 10), new Date(mid.getTime() - 86400000).toISOString().slice(0, 10));
  const out: Record<string, number> = {};
  for (const d of DOMAINS) {
    const p = prev7[d] ?? 0;
    out[d] = p > 0 ? (last7[d] ?? 0) / p : (last7[d] ?? 0) > 0 ? 1 : 0;
  }
  return out as Record<StrategyDomain, number>;
}

/** Drift: 3 consecutive days where top actual domain !== top planned domain. */
export async function getDriftAlert(strategyId: string): Promise<{ drift: boolean; message: string; pctOff: number } | null> {
  const supabase = await createClient();
  const { data: strategy } = await supabase
    .from("strategy_focus")
    .select("weekly_allocation")
    .eq("id", strategyId)
    .single();
  if (!strategy) return null;
  const planned = normalizeAllocation(strategy.weekly_allocation as Record<string, unknown>);
  const plannedTop = [...DOMAINS].sort((a, b) => (planned[b as StrategyDomain] ?? 0) - (planned[a as StrategyDomain] ?? 0))[0];

  const end = new Date();
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  let consecutive = 0;
  let totalScore = 0;
  let count = 0;
  for (const date of days) {
    const xp = await getXPByDomain(date, date);
    const total = Object.values(xp).reduce((a, b) => a + b, 0);
    if (total === 0) continue;
    const actualTop = [...DOMAINS].sort((a, b) => (xp[b as StrategyDomain] ?? 0) - (xp[a as StrategyDomain] ?? 0))[0];
    const plannedFrac = (planned[plannedTop as StrategyDomain] ?? 0) / 100;
    const actualFrac = (xp[actualTop as StrategyDomain] ?? 0) / total;
    totalScore += 1 - Math.abs(plannedFrac - actualFrac);
    count++;
    if (actualTop !== plannedTop) consecutive++;
    else consecutive = 0;
  }
  const avgAlignment = count > 0 ? totalScore / count : 1;
  const pctOff = Math.round((1 - avgAlignment) * 100);
  if (consecutive >= 3)
    return {
      drift: true,
      message: `Je wijkt ${pctOff}% af van je strategische allocatie.`,
      pctOff,
    };
  return null;
}

/** Strategic pressure index: (TargetRemaining / DaysRemaining) * MomentumFactor. <1 comfort, 1–1.5 health, >1.5 risk. Deadline gemist → pressure_boost_after_deadline, volgende cycle risk. */
export async function getPressureIndex(strategyId: string): Promise<{
  pressure: number;
  zone: "comfort" | "healthy" | "risk";
  daysRemaining: number;
  targetRemaining: number;
}> {
  const supabase = await createClient();
  const { data: strategy } = await supabase
    .from("strategy_focus")
    .select("deadline, target_metric, pressure_boost_after_deadline")
    .eq("id", strategyId)
    .single();
  if (!strategy) {
    return { pressure: 0, zone: "comfort", daysRemaining: 0, targetRemaining: 0 };
  }
  const deadline = new Date((strategy.deadline as string) + "T23:59:59");
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 86400000));
  const boost = (strategy as { pressure_boost_after_deadline?: boolean }).pressure_boost_after_deadline === true;
  if (daysRemaining <= 0 && !boost) {
    await supabase.from("strategy_focus").update({ pressure_boost_after_deadline: true, updated_at: new Date().toISOString() }).eq("id", strategyId);
  }
  const momentum = await getMomentumByDomain();
  const avgMomentum = Object.values(momentum).reduce((a, b) => a + b, 0) / 4;
  const momentumFactor = avgMomentum > 0 ? Math.min(2, avgMomentum) : 0.5;
  const targetRemaining = 100;
  const pressure = daysRemaining > 0 ? (targetRemaining / daysRemaining) * momentumFactor : 2;
  let zone: "comfort" | "healthy" | "risk" = "comfort";
  if (boost || daysRemaining <= 0 || pressure >= 1.5) zone = "risk";
  else if (pressure >= 1) zone = "healthy";
  return { pressure: boost || daysRemaining <= 0 ? Math.max(pressure, 1.5) : pressure, zone, daysRemaining, targetRemaining };
}

/** Strategy reviews: last one and whether weekly review is due. */
export async function getStrategyReviewStatus(
  strategyId: string,
  strategyStartDate: string
): Promise<{
  lastReview: StrategyReviewRow | null;
  weekStart: string;
  weekNumber: number;
  reviewDue: boolean;
}> {
  const supabase = await createClient();
  const now = new Date();
  const day = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const start = new Date(strategyStartDate);
  const weekNumber = Math.max(
    0,
    Math.floor((weekStart.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
  );

  const { data: last } = await supabase
    .from("strategy_review")
    .select("*")
    .eq("strategy_id", strategyId)
    .order("week_number", { ascending: false })
    .limit(1)
    .single();

  const lastReview = last as StrategyReviewRow | null;
  const lastWeekStart = lastReview?.week_start;
  const reviewDue = !lastWeekStart || lastWeekStart < weekStartStr;

  return { lastReview, weekStart: weekStartStr, weekNumber, reviewDue };
}

/** Create or update weekly strategy review. */
export async function upsertStrategyReview(params: {
  strategyId: string;
  weekNumber: number;
  weekStart: string;
  alignment_score?: number | null;
  biggest_drift_domain?: string | null;
  strongest_domain?: string | null;
  notes?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: s } = await supabase.from("strategy_focus").select("id").eq("id", params.strategyId).eq("user_id", user.id).single();
  if (!s) throw new Error("Strategy not found");
  await supabase.from("strategy_review").upsert(
    {
      strategy_id: params.strategyId,
      week_number: params.weekNumber,
      week_start: params.weekStart,
      alignment_score: params.alignment_score ?? null,
      biggest_drift_domain: params.biggest_drift_domain ?? null,
      strongest_domain: params.strongest_domain ?? null,
      notes: params.notes ?? null,
    },
    { onConflict: "strategy_id,week_number" }
  );
  revalidatePath("/strategy");
}

/** This week's alignment: planned from strategy, actual from XP this week. */
export async function getAlignmentThisWeek(strategyId: string): Promise<{
  planned: Record<string, number>;
  actual: Record<string, number>;
  alignmentScore: number;
}> {
  const supabase = await createClient();
  const { data: strategy } = await supabase
    .from("strategy_focus")
    .select("weekly_allocation")
    .eq("id", strategyId)
    .single();
  if (!strategy) {
    const empty = { discipline: 0.25, health: 0.25, learning: 0.25, business: 0.25 };
    return { planned: empty, actual: empty, alignmentScore: 1 };
  }
  const planned = distributionFractions(
    normalizeAllocation(strategy.weekly_allocation as Record<string, unknown>)
  );
  const now = new Date();
  const day = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);
  const xpByDomain = await getXPByDomain(weekStartStr, todayStr);
  const total = Object.values(xpByDomain).reduce((a, b) => a + b, 0);
  const actual: Record<string, number> = {};
  if (total > 0) {
    for (const d of DOMAINS) actual[d] = (xpByDomain[d] ?? 0) / total;
  } else {
    for (const d of DOMAINS) actual[d] = 0.25;
  }
  const score = alignmentScore(planned, actual);
  return { planned, actual, alignmentScore: score };
}
