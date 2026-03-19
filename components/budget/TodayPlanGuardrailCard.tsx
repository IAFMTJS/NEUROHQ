"use client";

import Link from "next/link";
import { formatCents } from "@/lib/utils/currency";

type Props = {
  remainingToSpendCents: number | null;
  daysUntilNextIncome: number;
  currency: string;
};

export function TodayPlanGuardrailCard({
  remainingToSpendCents,
  daysUntilNextIncome,
  currency,
}: Props) {
  const safeToday =
    remainingToSpendCents != null && daysUntilNextIncome > 0
      ? Math.floor(remainingToSpendCents / Math.max(1, daysUntilNextIncome))
      : 0;
  const caution = remainingToSpendCents != null && remainingToSpendCents < 0;

  return (
    <section className="card-simple overflow-hidden p-0 ring-1 ring-violet-400/20 shadow-[0_0_22px_rgba(139,92,246,0.1)]">
      <div className="border-b border-[var(--card-border)] bg-[linear-gradient(90deg,rgba(139,92,246,0.1),rgba(59,130,246,0.04))] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Today plan guardrail</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Wat mag je vandaag uitgeven zonder je cyclusplan te breken?
        </p>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">Safe today budget</p>
          <p className={`text-lg font-semibold tabular-nums ${caution ? "text-amber-400" : "text-[var(--accent-primary)]"}`}>
            {formatCents(safeToday, currency)}
          </p>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Gebaseerd op remaining en dagen tot volgende loon.
        </p>
        <Link href="/budget?tab=tactical#grocery-mission-planner" className="text-xs font-medium text-[var(--accent-focus)] hover:underline">
          Plan vandaag →
        </Link>
      </div>
    </section>
  );
}
