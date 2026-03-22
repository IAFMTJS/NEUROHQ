"use client";

import { useBudgetLock } from "@/components/budget/BudgetLockContext";

/** Shown in Modal header when no-spend lock is active (budget tab). */
export function BudgetLockHeaderBadge() {
  const { lockActive } = useBudgetLock();
  if (!lockActive) return null;
  return (
    <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
      Lock actief
    </span>
  );
}
