"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { getTodayKey } from "@/lib/daily-date";
import type { DailySnapshot } from "@/types/daily-snapshot";
import type { DashboardCritical } from "@/types/dashboard-data.types";
import type { Task } from "@/types/database.types";
import { useHQStore } from "@/lib/hq-store";
import { getDcicGameStateFromSnapshot } from "@/lib/daily-snapshot-full-sync";
import { applyDCICModeOverrideIfAny } from "@/lib/dcic/dcic-mode-override";
import { markDcicSeededFromDailySnapshot } from "@/lib/dcic/game-state-client";
import type { MissionsPipelinePayload } from "@/lib/missions/derive-mission-capacity";
import type { LearningSnapshot as StoreLearningSnapshot } from "@/types/hq-store.types";

type Props = {
  snapshot: DailySnapshot | null;
  children: ReactNode;
};

/**
 * Hydrates the HQ store from the in-memory bootstrap snapshot before child content paints.
 * Runs as the first child under `BootstrapGate` so `useLayoutEffect` runs before page components.
 */
export function StoreHydrator({ snapshot, children }: Props) {
  useLayoutEffect(() => {
    if (!snapshot) return;

    const dcic = getDcicGameStateFromSnapshot(snapshot);
    if (dcic) {
      applyDCICModeOverrideIfAny(dcic);
      markDcicSeededFromDailySnapshot();
    }

    const critical = snapshot.dashboard?.critical as DashboardCritical | undefined;
    let missionsPipe: MissionsPipelinePayload | null = null;
    if (critical?.missionsPipeline) {
      missionsPipe = critical.missionsPipeline;
    } else if (
      snapshot.missions?.decisionBlocks != null &&
      snapshot.missions?.capacity != null
    ) {
      missionsPipe = {
        decisionBlocks: snapshot.missions.decisionBlocks,
        capacity: snapshot.missions.capacity,
        buildMeta: snapshot.missions.buildMeta ?? { builtAt: Date.now() },
        rankedTaskIds:
          snapshot.missions.rankedTaskIds ??
          snapshot.missions.decisionBlocks.tasksSortedByUMS.map((t) => t.id),
      };
    }

    useHQStore.setState((s) => {
      let todayDateNext = s.todayDate;
      if (snapshot.missions?.dateStr) todayDateNext = snapshot.missions.dateStr;
      else if (snapshot.date) todayDateNext = snapshot.date;

      const nextTasksByDate = { ...s.tasksByDate };
      if (snapshot.missions) {
        const todayKey = getTodayKey();
        for (const [day, tasks] of Object.entries(snapshot.missions.tasksByDate)) {
          if (day === todayKey) continue;
          nextTasksByDate[day] = (tasks ?? []) as Task[];
        }
      }

      return {
        ...s,
        todayDate: todayDateNext,
        gameState: dcic ?? s.gameState,
        dashboardCritical: snapshot.dashboard
          ? ((snapshot.dashboard.critical as DashboardCritical | null) ?? s.dashboardCritical)
          : s.dashboardCritical,
        dashboardSecondary: snapshot.dashboard
          ? ((snapshot.dashboard.secondary as typeof s.dashboardSecondary) ?? s.dashboardSecondary)
          : s.dashboardSecondary,
        missionsPipeline: missionsPipe !== null ? missionsPipe : s.missionsPipeline,
        todayDailyState: snapshot.missions?.dailyState ?? s.todayDailyState,
        todayEnergyBudget: snapshot.missions?.energyBudget ?? s.todayEnergyBudget,
        tasksByDate: nextTasksByDate,
        tasksStatus: snapshot.missions ? "ready" : s.tasksStatus,
        tasksError: snapshot.missions ? null : s.tasksError,
        budgetSnapshot: snapshot.budget
          ? {
              settings: snapshot.budget.settings,
              currentMonthExpenses: snapshot.budget.currentMonthExpenses,
              currentMonthIncome: snapshot.budget.currentMonthIncome,
              currentWeekExpenses: snapshot.budget.currentWeekExpenses,
              currentWeekIncome: snapshot.budget.currentWeekIncome,
              budgetRemainingCents: snapshot.budget.budgetRemainingCents,
              date: snapshot.budget.today,
              currency: snapshot.budget.currency,
              isWeekly: snapshot.budget.isWeekly,
              periodLabel: snapshot.budget.periodLabel,
              disciplineScore: snapshot.budget.disciplineScore,
              disciplineXpThisWeek: snapshot.budget.disciplineXpThisWeek,
              disciplineCompletedToday: snapshot.budget.disciplineCompletedToday,
              daysUnderBudgetThisWeek: snapshot.budget.daysUnderBudgetThisWeek,
              unplannedSummary: snapshot.budget.unplannedSummary,
              financeState: snapshot.budget.financeState,
              financialInsights: snapshot.budget.financialInsights,
            }
          : s.budgetSnapshot,
        budgetStatus: snapshot.budget ? "ready" : s.budgetStatus,
        budgetError: snapshot.budget ? null : s.budgetError,
        learningSnapshot: snapshot.learning
          ? ({
              weeklyMinutes: snapshot.learning.weeklyMinutes,
              weeklyLearningTarget: snapshot.learning.weeklyLearningTarget,
              learningStreak: snapshot.learning.learningStreak,
              focus: snapshot.learning.focus as StoreLearningSnapshot["focus"],
              streams: snapshot.learning.streams as StoreLearningSnapshot["streams"],
              consistency: snapshot.learning.consistency as StoreLearningSnapshot["consistency"],
              reflection: snapshot.learning.reflection,
            } satisfies StoreLearningSnapshot)
          : s.learningSnapshot,
        learningStatus: snapshot.learning ? "ready" : s.learningStatus,
        learningError: snapshot.learning ? null : s.learningError,
      };
    });
  }, [snapshot]);

  return <>{children}</>;
}
