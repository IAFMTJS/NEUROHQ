"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { useHQStore } from "@/lib/hq-store";
import { getTodayKey } from "@/lib/daily-date";
import { useBootstrapToday } from "@/lib/use-bootstrap-today";
import { budgetFromBootstrapToday } from "@/lib/bootstrap-today-mappers";

type Props = {
  children: ReactNode;
};

/**
 * Hydrates the HQ store budget slice from the DailySnapshot when available.
 * This doesn't change server rendering of /budget yet, but ensures client-side
 * widgets and any future budget client views have instant snapshot data.
 */
export function BudgetSnapshotProvider({ children }: Props) {
  const snapshot = useDailySnapshot();
  const dayKey = snapshot?.date ?? getTodayKey();
  const { data: bootstrapToday } = useBootstrapToday(dayKey);
  const budget = useMemo(() => {
    if (snapshot?.budget) return snapshot.budget;
    return budgetFromBootstrapToday(bootstrapToday, dayKey);
  }, [snapshot?.budget, bootstrapToday, dayKey]);

  const setBudgetSnapshot = useHQStore((s) => s.setBudgetSnapshot);
  const setBudgetStatus = useHQStore((s) => s.setBudgetStatus);
  const setBudgetError = useHQStore((s) => s.setBudgetError);

  useEffect(() => {
    if (!budget) return;
    setBudgetSnapshot({
      settings: budget.settings,
      currentMonthExpenses: budget.currentMonthExpenses,
      budgetRemainingCents: budget.budgetRemainingCents,
      date: budget.today,
      currentMonthIncome: budget.currentMonthIncome,
      currentWeekExpenses: budget.currentWeekExpenses,
      currentWeekIncome: budget.currentWeekIncome,
      currency: budget.currency,
      isWeekly: budget.isWeekly,
      periodLabel: budget.periodLabel,
      disciplineScore: budget.disciplineScore,
      disciplineXpThisWeek: budget.disciplineXpThisWeek,
      disciplineCompletedToday: budget.disciplineCompletedToday,
      daysUnderBudgetThisWeek: budget.daysUnderBudgetThisWeek,
      unplannedSummary: budget.unplannedSummary,
      financeState: budget.financeState,
      financialInsights: budget.financialInsights,
    });
    setBudgetStatus("ready");
    setBudgetError(null);
  }, [budget, setBudgetError, setBudgetSnapshot, setBudgetStatus]);

  return <>{children}</>;
}

