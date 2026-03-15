"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { getTodayKey } from "@/lib/daily-date";
import type { DailySnapshot } from "@/types/daily-snapshot";
import type { Task } from "@/types/database.types";
import { useHQStore } from "@/lib/hq-store";

type Props = {
  snapshot: DailySnapshot | null;
  children: ReactNode;
};

/**
 * Hydrates the HQ store from the daily snapshot before the rest of the tree paints.
 * Ensures pages see data immediately (no flash of loading/empty) when we have a
 * same-day snapshot. Run as first child of DailySnapshotContext so useLayoutEffect
 * runs before any page content.
 */
export function StoreHydrator({ snapshot, children }: Props) {
  useLayoutEffect(() => {
    if (!snapshot) return;

    const {
      setTodayDate,
      setDashboardSnapshot,
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

    if (snapshot.dashboard) {
      setDashboardSnapshot({
        critical: snapshot.dashboard.critical,
        secondary: snapshot.dashboard.secondary,
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
        focus: l.focus,
        streams: l.streams,
        consistency: l.consistency,
        reflection: l.reflection,
      });
      setLearningStatus("ready");
      setLearningError(null);
    }
  }, [snapshot]);

  return <>{children}</>;
}
