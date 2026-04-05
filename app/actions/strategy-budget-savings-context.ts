"use server";

import { cache } from "react";
import { getBudgetSettings } from "@/app/actions/budget";
import { getSavingsGoals } from "@/app/actions/savings";
import type { StrategyBudgetSavingsContext } from "@/lib/strategy/engine-params";

/** Eén request-cache: Budget spaarreserve + actieve spaardoelen voor Strategy-koppeling. */
export const getStrategyBudgetSavingsContext = cache(async (): Promise<StrategyBudgetSavingsContext> => {
  const [settings, goals] = await Promise.all([getBudgetSettings(), getSavingsGoals()]);
  return {
    budgetMonthlySavingsCents: settings.monthly_savings_cents,
    savingsGoals: goals.map((g) => ({
      target_cents: g.target_cents,
      current_cents: g.current_cents,
      deadline: g.deadline,
      status: g.status ?? null,
    })),
  };
});
