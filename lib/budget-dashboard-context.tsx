"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getBudgetContextLocalFirst, type BudgetContextPayload } from "@/lib/data/budget-repository";

const BudgetDashboardContext = createContext<{
  budget: BudgetContextPayload;
  invalidate: () => Promise<void>;
}>({ budget: null, invalidate: async () => {} });

async function fetchBudgetContext(): Promise<BudgetContextPayload> {
  const result = await getBudgetContextLocalFirst({ preferCache: false });
  return result.budget;
}

export function BudgetDashboardProvider({ children }: { children: ReactNode }) {
  const [budget, setBudget] = useState<BudgetContextPayload>(null);

  const invalidate = useCallback(async () => {
    try {
      const next = await fetchBudgetContext();
      setBudget(next);
    } catch {
      setBudget(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    getBudgetContextLocalFirst({ signal: controller.signal, preferCache: false })
      .then((result) => {
        if (!cancelled) setBudget(result.budget);
      })
      .catch(() => {
        if (!cancelled) setBudget(null);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
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
