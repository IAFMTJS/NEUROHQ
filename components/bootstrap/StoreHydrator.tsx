"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { getTodayKey } from "@/lib/daily-date";
import type { DailySnapshot } from "@/types/daily-snapshot";
import type { Task } from "@/types/database.types";
import { useHQStore } from "@/lib/hq-store";
import { getDcicGameStateFromSnapshot } from "@/lib/daily-snapshot-full-sync";
import { applyDCICModeOverrideIfAny } from "@/lib/dcic/dcic-mode-override";
import { markDcicSeededFromDailySnapshot } from "@/lib/dcic/game-state-client";

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

    const {
      setTodayDate,
      setDashboardSnapshot,
      setGameState,
      setTasksForDate,
      setTasksStatus,
      setTasksError,
      setTodayDailyState,
      setTodayEnergyBudget,
      setBudgetSnapshot,
      setBudgetStatus,
      setBudgetError,
      setLearningSnapshot,
      setLearningStatus,
      setLearningError,
    } = useHQStore.getState();

    if (snapshot.date) {
      setTodayDate(snapshot.date);
    }

    const dcic = getDcicGameStateFromSnapshot(snapshot);
    if (dcic) {
      applyDCICModeOverrideIfAny(dcic);
      setGameState(dcic);
      markDcicSeededFromDailySnapshot();
    }

    if (snapshot.dashboard) {
      setDashboardSnapshot({
        critical: snapshot.dashboard.critical as any,
        secondary: snapshot.dashboard.secondary as any,
      });
    }

    if (snapshot.missions) {
      const { dateStr, tasksByDate, dailyState, energyBudget } = snapshot.missions;
      const todayKey = getTodayKey();
      setTodayDate(dateStr);
      if (dailyState) setTodayDailyState(dailyState);
      if (energyBudget) setTodayEnergyBudget(energyBudget);
      for (const [day, tasks] of Object.entries(tasksByDate)) {
        if (day === todayKey) continue;
        setTasksForDate(day, (tasks ?? []) as Task[]);
      }
      setTasksError(null);
      setTasksStatus("ready");
    }

    if (snapshot.budget) {
      const b = snapshot.budget;
      setBudgetSnapshot({
        settings: b.settings,
        currentMonthExpenses: b.currentMonthExpenses,
        currentMonthIncome: b.currentMonthIncome,
        currentWeekExpenses: b.currentWeekExpenses,
        currentWeekIncome: b.currentWeekIncome,
        budgetRemainingCents: b.budgetRemainingCents,
        date: b.today,
        currency: b.currency,
        isWeekly: b.isWeekly,
        periodLabel: b.periodLabel,
        disciplineScore: b.disciplineScore,
        disciplineXpThisWeek: b.disciplineXpThisWeek,
        disciplineCompletedToday: b.disciplineCompletedToday,
        daysUnderBudgetThisWeek: b.daysUnderBudgetThisWeek,
        unplannedSummary: b.unplannedSummary,
        financeState: b.financeState,
        financialInsights: b.financialInsights,
      });
      setBudgetStatus("ready");
      setBudgetError(null);
    }

    if (snapshot.learning) {
      const l = snapshot.learning;
      setLearningSnapshot({
        weeklyMinutes: l.weeklyMinutes,
        weeklyLearningTarget: l.weeklyLearningTarget,
        learningStreak: l.learningStreak,
        focus: (l as any).focus,
        streams: (l as any).streams,
        consistency: (l as any).consistency,
        reflection: l.reflection as any,
      });
      setLearningStatus("ready");
      setLearningError(null);
    }
  }, [snapshot]);

  return <>{children}</>;
}
