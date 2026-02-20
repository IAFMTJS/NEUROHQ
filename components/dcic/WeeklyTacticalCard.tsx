/**
 * Dark Commander Intelligence Core - Weekly Tactical Plan Card
 * Shows weekly allowance and remaining this week
 */

"use client";

import type { FinanceState } from "@/lib/dcic/types";
import { calculateWeeklyAllowance } from "@/lib/dcic/finance-engine";

interface WeeklyTacticalCardProps {
  financeState: FinanceState | null;
}

export function WeeklyTacticalCard({ financeState }: WeeklyTacticalCardProps) {
  if (!financeState) return null;

  const weekly = calculateWeeklyAllowance(financeState);

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Weekly Tactical Plan
      </h3>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">This Week Safe Spend</p>
          <p className="text-2xl font-bold text-[var(--accent-primary)]">
            €{(weekly.weekAllowance / 100).toFixed(2)}
          </p>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-[var(--card-border)]">
          <span className="text-sm text-[var(--text-muted)]">Remaining This Week</span>
          <span className={`text-lg font-semibold ${
            weekly.remainingThisWeek > weekly.weekAllowance * 0.5
              ? "text-green-500"
              : weekly.remainingThisWeek > weekly.weekAllowance * 0.2
              ? "text-yellow-500"
              : "text-red-500"
          }`}>
            €{(weekly.remainingThisWeek / 100).toFixed(2)}
          </span>
        </div>
        
        <p className="text-xs text-[var(--text-muted)]">
          {weekly.daysInWeek} days remaining in week
        </p>
      </div>
    </div>
  );
}
