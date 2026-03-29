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

  const [todays, weekLoad, finance, growth, strategyRow, domainRes] = await Promise.all([
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
    strategy,
  };
}
