"use client";

import { createContext, useContext, type ReactNode } from "react";

export type BudgetLockContextValue = {
  lockActive: boolean;
  lockUntil: string | null;
};

const BudgetLockContext = createContext<BudgetLockContextValue | null>(null);

export function BudgetLockProvider({
  value,
  children,
}: {
  value: BudgetLockContextValue;
  children: ReactNode;
}) {
  return <BudgetLockContext.Provider value={value}>{children}</BudgetLockContext.Provider>;
}

export function useBudgetLock(): BudgetLockContextValue {
  const v = useContext(BudgetLockContext);
  return v ?? { lockActive: false, lockUntil: null };
}
