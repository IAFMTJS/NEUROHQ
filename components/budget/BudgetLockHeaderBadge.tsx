"use client";

import { useBudgetLock } from "@/components/budget/BudgetLockContext";

/** Shown in Modal header when no-spend lock is active (budget tab). */
export function BudgetLockHeaderBadge() {
  const { lockActive } = useBudgetLock();
  if (!lockActive) return null;
  return (
    <span className="rounded-full border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb),0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--semantic-accent)]">
      Lock actief
    </span>
  );
}
