"use client";

import type { FC } from "react";
import { ExpenseDistributionChart } from "@/components/budget/ExpenseDistributionChart";
import { BudgetPlanCard } from "@/components/budget/BudgetPlanCard";

type TargetRow = { category: string; target_cents: number; priority: number; flexible: boolean };

type Props = {
  categoryTotals: Record<string, number>;
  targets: TargetRow[];
  currency: string;
};

/** Tactical Category Spending card: donut + per-category budget vs spent bars. */
export const CategorySpendingCard: FC<Props> = ({ categoryTotals, targets, currency }) => {
  return (
    <div className="space-y-4">
      <ExpenseDistributionChart categoryTotals={categoryTotals} currency={currency} />
      <BudgetPlanCard targets={targets} spentByCategory={categoryTotals} currency={currency} />
    </div>
  );
};

