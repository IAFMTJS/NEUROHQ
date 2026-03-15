"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type BudgetContextPayload = {
  periodStart: string;
  periodEnd: string | null;
  periodLabel: string;
  nextPaydayDate: string;
  daysUntilNextIncome: number;
  budgetRemainingCents: number | null;
  disciplineScore: number;
  safeDailySpend: number;
  currency: string;
} | null;

const BudgetDashboardContext = createContext<{
  budget: BudgetContextPayload;
  invalidate: () => Promise<void>;
}>({ budget: null, invalidate: async () => {} });

async function fetchBudgetContext(): Promise<BudgetContextPayload> {
  const res = await fetch("/api/budget/context", { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data as BudgetContextPayload;
}

export function BudgetDashboardProvider({ children }: { children: ReactNode }) {
  const [budget, setBudget] = useState<BudgetContextPayload>(null);

  const invalidate = useCallback(async () => {
    const next = await fetchBudgetContext();
    setBudget(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchBudgetContext().then((data) => {
      if (!cancelled) setBudget(data);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <BudgetDashboardContext.Provider value={{ budget, invalidate }}>
      {children}
    </BudgetDashboardContext.Provider>
  );
}

export function useBudgetDashboard() {
  return useContext(BudgetDashboardContext);
}
