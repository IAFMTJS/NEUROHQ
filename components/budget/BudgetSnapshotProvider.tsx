"use client";

import { useEffect, type ReactNode } from "react";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { useHQStore } from "@/lib/hq-store";

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
  const budget = snapshot?.budget ?? null;

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
      currency: budget.currency,
      isWeekly: budget.isWeekly,
      periodLabel: budget.periodLabel,
      disciplineScore: budget.disciplineScore,
      disciplineXpThisWeek: budget.disciplineXpThisWeek,
      disciplineCompletedToday: budget.disciplineCompletedToday,
      daysUnderBudgetThisWeek: budget.daysUnderBudgetThisWeek,
      unplannedSummary: budget.unplannedSummary,
    });
    setBudgetStatus("ready");
    setBudgetError(null);
  }, [budget, setBudgetError, setBudgetSnapshot, setBudgetStatus]);

  return <>{children}</>;
}

