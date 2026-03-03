/**
 * Dark Commander Intelligence Core - Weekly Tactical Plan Card
 * Shows weekly allowance and remaining this week
 */

"use client";

import type { FinanceState } from "@/lib/dcic/types";
import {
  calculateWeeklyAllowance,
  getExtremeSavingsTips,
  proposeWeeklyPattern,
} from "@/lib/dcic/finance-engine";

interface WeeklyTacticalCardProps {
  financeState: FinanceState | null;
}

export function WeeklyTacticalCard({ financeState }: WeeklyTacticalCardProps) {
  if (!financeState) return null;

  const weekly = calculateWeeklyAllowance(financeState);
  const isNegative = weekly.remainingThisWeek < 0;
  const pattern = proposeWeeklyPattern(financeState);
  const extremeTips = getExtremeSavingsTips(weekly.remainingThisWeek);

  const safeSpendDisplay = weekly.weekAllowance > 0 ? weekly.weekAllowance : 0;
  const overThisWeek = weekly.remainingThisWeek < 0 ? Math.abs(weekly.remainingThisWeek) : 0;
  const valueThisWeekCents = overThisWeek > 0 ? overThisWeek : weekly.remainingThisWeek;

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Weekly Tactical Plan
      </h3>
      
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs text-[var(--text-muted)]">This Week Safe Spend (flexibele pot)</p>
          <p
            className={`text-2xl font-bold ${
              weekly.weekAllowance < 0 ? "text-red-500" : "text-[var(--accent-primary)]"
            }`}
          >
            €{(safeSpendDisplay / 100).toFixed(2)}
          </p>
          {weekly.weekAllowance < 0 && (
            <p className="mt-1 text-xs text-red-400">
              Je flexibele pot voor deze week is op. Nieuwe optionele uitgaven trekken je onder je eigen grens.
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between border-t border-[var(--card-border)] pt-2">
          <span className="text-sm text-[var(--text-muted)]">
            {overThisWeek > 0 ? "Over budget this week" : "Remaining This Week"}
          </span>
          <span className={`text-lg font-semibold ${
            isNegative
              ? "text-red-500"
              : weekly.remainingThisWeek > weekly.weekAllowance * 0.5
                ? "text-green-500"
                : weekly.remainingThisWeek > (weekly.weekAllowance || 1) * 0.2
                  ? "text-yellow-500"
                  : "text-red-500"
          }`}>
            €{(Math.max(0, valueThisWeekCents) / 100).toFixed(2)}
          </span>
        </div>
        
        <p className="text-xs text-[var(--text-muted)]">
          {weekly.daysInWeek} days remaining in week · patroon: {pattern.lowDays} low-spend,{" "}
          {pattern.normalDays} normaal, {pattern.treatDays} treat.
        </p>

        {pattern.recommendedExtraLowDays > 0 && (
          <p className="text-xs text-amber-300">
            Advies: plan minstens {pattern.recommendedExtraLowDays} extra low-spend dag
            {pattern.recommendedExtraLowDays > 1 ? "en" : ""} om je tempo weer in lijn te brengen.
          </p>
        )}

        {isNegative && extremeTips.length > 0 && (
          <div className="pt-2 border-t border-[var(--card-border)]">
            <p className="text-xs font-medium text-red-500 mb-1">Extreme bespaartips (budget overschreden):</p>
            <ul className="space-y-1 text-xs text-[var(--text-muted)]">
              {extremeTips.map((tip, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-red-400 shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
