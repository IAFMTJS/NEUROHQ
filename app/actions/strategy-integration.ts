"use server";

import { createClient } from "@/lib/supabase/server";
import { getFinanceState } from "@/app/actions/dcic/finance-state";
import { getGrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { getActiveStrategyFocus } from "@/app/actions/strategyFocus";
import { getTodaysTasks, getWeekPlannedLoad } from "@/app/actions/tasks";
import { DOMAINS, domainLabel, type StrategyDomain, type WeeklyAllocation } from "@/lib/strategyDomains";
import { getBudgetToday, getBudgetWeekBounds } from "@/lib/utils/budget-date";
import { calculateSafeDailySpend } from "@/lib/dcic/finance-engine";

export type StrategyIntegrationOverview = {
  todayOpenMissionCount: number;
  week: {
    start: string;
    end: string;
    totalOpenTasks: number;
    overloadDays: number;
    domainCounts: Record<StrategyDomain, number>;
  };
  budget: {
    hasPlanning: boolean;
    plannedBudgetCents: number | null;
    remainingCents: number | null;
    safeDailyCents: number | null;
    daysUntilIncome: number | null;
    disciplineScore: number | null;
    weekSpentCents: number | null;
  };
  growth: Awaited<ReturnType<typeof getGrowthEngineSnapshot>>;
  growthTasksWeek: {
    weekStart: string;
    weekEnd: string;
    assigned: number;
    done: number;
    open: number;
    /** “Consistency / churn” signals (penalty inputs). */
    edits: number;
    reschedules: number;
    deletes: number;
    skips: number;
  };
  strategy: {
    primaryDomain: StrategyDomain;
    weeklyAllocation: WeeklyAllocation;
  } | null;
};

function emptyDomainCounts(): Record<StrategyDomain, number> {
  const o = {} as Record<StrategyDomain, number>;
  for (const d of DOMAINS) o[d] = 0;
  return o;
}

function hasPersonalGrowthTag(taskTags: unknown): boolean {
  if (!Array.isArray(taskTags)) return false;
  return taskTags.some((t) => typeof t === "string" && (t === "personal_growth" || t.startsWith("pg_") || t.startsWith("pg:")));
}

/**
 * One snapshot for the Strategy page: missions load, budget signals, growth engine, optional active strategy focus.
 */
export async function getStrategyIntegrationOverview(): Promise<StrategyIntegrationOverview | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = getBudgetToday();
  const { start: weekStart, end: weekEnd } = getBudgetWeekBounds(today);

  const weekEndExclusive = new Date(`${weekEnd}T00:00:00.000Z`);
  weekEndExclusive.setUTCDate(weekEndExclusive.getUTCDate() + 1);
  const weekEndExclusiveIso = weekEndExclusive.toISOString();

  const [todays, weekLoad, finance, growth, strategyRow, domainRes, growthTasksRes, outcomeRes] = await Promise.all([
    getTodaysTasks(today, "driven"),
    getWeekPlannedLoad(weekStart),
    getFinanceState().catch(() => null),
    getGrowthEngineSnapshot(),
    getActiveStrategyFocus().catch(() => null),
    supabase
      .from("tasks")
      .select("domain")
      .eq("user_id", user.id)
      .eq("completed", false)
      .is("deleted_at", null)
      .gte("due_date", weekStart)
      .lte("due_date", weekEnd),
    supabase
      .from("tasks")
      .select("id, completed, completed_at, task_tags, deleted_at, created_at, updated_at, due_date")
      .eq("user_id", user.id)
      .gte("due_date", weekStart)
      .lte("due_date", weekEnd),
    supabase
      .from("mission_outcome_events")
      .select("outcome, task_id, occurred_at")
      .eq("user_id", user.id)
      .gte("occurred_at", `${weekStart}T00:00:00.000Z`)
      .lt("occurred_at", weekEndExclusiveIso),
  ]);

  const domainCounts = emptyDomainCounts();
  for (const row of domainRes.data ?? []) {
    const d = (row as { domain?: string | null }).domain;
    if (d && DOMAINS.includes(d as StrategyDomain)) {
      domainCounts[d as StrategyDomain]++;
    }
  }

  const totalOpenTasks = weekLoad.reduce((s, d) => s + d.taskCount, 0);
  const overloadDays = weekLoad.filter((d) => d.isOverload).length;

  const planning = finance?.planning;
  const hasPlanning = !!planning && (planning.plannedBudgetCents ?? 0) > 0;

  let safeDailyCents: number | null = null;
  if (finance) {
    try {
      safeDailyCents = calculateSafeDailySpend(finance);
    } catch {
      safeDailyCents = null;
    }
  }

  const strategy =
    strategyRow && strategyRow.is_active
      ? {
          primaryDomain: strategyRow.primary_domain,
          weeklyAllocation: strategyRow.weekly_allocation,
        }
      : null;

  const growthTaskRows = (growthTasksRes.data ?? []) as Array<{
    id: string;
    completed?: boolean | null;
    completed_at?: string | null;
    task_tags?: unknown;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
    due_date?: string | null;
  }>;
  const growthTasks = growthTaskRows.filter((r) => hasPersonalGrowthTag(r.task_tags));
  const assigned = growthTasks.length;
  const done = growthTasks.filter((r) => r.completed === true).length;
  const open = Math.max(0, assigned - done);

  const growthTaskIdSet = new Set(growthTasks.map((t) => t.id));

  // “Edits” is intentionally conservative: only count tasks that were changed >15 minutes after creation
  // while still relevant to this week’s plan.
  const EDIT_GRACE_MS = 15 * 60 * 1000;
  const edits = growthTasks.filter((t) => {
    const created = new Date(t.created_at).getTime();
    const updated = new Date(t.updated_at).getTime();
    if (!Number.isFinite(created) || !Number.isFinite(updated)) return false;
    if (updated - created <= EDIT_GRACE_MS) return false;
    // If completed, only count as edit if it happened before completion (avoid “completion write” noise).
    if (t.completed_at) {
      const completedAt = new Date(t.completed_at).getTime();
      if (Number.isFinite(completedAt) && updated >= completedAt) return false;
    }
    return true;
  }).length;

  let reschedules = 0;
  let deletes = 0;
  let skips = 0;
  for (const row of (outcomeRes.data ?? []) as Array<{ outcome?: string | null; task_id?: string | null }>) {
    const taskId = row.task_id ?? null;
    if (!taskId || !growthTaskIdSet.has(taskId)) continue;
    if (row.outcome === "reschedule") reschedules++;
    else if (row.outcome === "delete") deletes++;
    else if (row.outcome === "skip") skips++;
  }

  return {
    todayOpenMissionCount: todays.tasks.length,
    week: {
      start: weekStart,
      end: weekEnd,
      totalOpenTasks,
      overloadDays,
      domainCounts,
    },
    budget: {
      hasPlanning,
      plannedBudgetCents: planning?.plannedBudgetCents ?? null,
      remainingCents: planning?.plannedRemainingCents ?? null,
      safeDailyCents,
      daysUntilIncome: finance?.cycle?.daysUntilNextIncome ?? null,
      disciplineScore: finance?.disciplineScore ?? null,
      weekSpentCents: planning?.weekSpentCents ?? null,
    },
    growth,
    growthTasksWeek: {
      weekStart,
      weekEnd,
      assigned,
      done,
      open,
      edits,
      reschedules,
      deletes,
      skips,
    },
    strategy,
  };
}
