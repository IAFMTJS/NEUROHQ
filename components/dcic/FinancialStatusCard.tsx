/**
 * Dark Commander Intelligence Core - Financial Status Card
 * Shows safe daily spend, days until next income, current balance
 */

"use client";

import { useEffect, useState } from "react";
import type { FinanceState } from "@/lib/dcic/types";
import {
  calculateSafeDailySpend,
  getDaysUntilNextIncome,
  getRemainingBalance,
} from "@/lib/dcic/finance-engine";

interface FinancialStatusCardProps {
  financeState: FinanceState | null;
}

export function FinancialStatusCard({ financeState }: FinancialStatusCardProps) {
  if (!financeState) {
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4">
        <p className="text-sm text-[var(--text-muted)]">Finance data niet beschikbaar</p>
      </div>
    );
  }

  const safeDailySpend = calculateSafeDailySpend(financeState);
  const daysUntilIncome = getDaysUntilNextIncome(financeState);
  const remainingBalance = getRemainingBalance(financeState);

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Financial Status
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-[var(--text-muted)]">Safe Daily Spend</span>
          <span className="text-lg font-semibold text-[var(--accent-primary)]">
            €{(safeDailySpend / 100).toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-[var(--text-muted)]">Days Until Income</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {daysUntilIncome} days
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-[var(--text-muted)]">Remaining Balance</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            €{(remainingBalance / 100).toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-[var(--text-muted)]">Discipline Score</span>
          <span className={`text-sm font-semibold ${
            financeState.disciplineScore >= 80 ? "text-green-500" :
            financeState.disciplineScore >= 60 ? "text-yellow-500" :
            "text-red-500"
          }`}>
            {financeState.disciplineScore}/100
          </span>
        </div>
      </div>
    </div>
  );
}
