"use client";

import Link from "next/link";
import type { Insight } from "@/lib/dcic/finance-engine";

type Props = {
  daysUnderBudget: number | null | undefined;
  disciplineXp: number | null | undefined;
  insights: Insight[] | null | undefined;
  topInsightOverride?: Insight | null;
};

function pickTopInsight(insights: Insight[] | null | undefined): Insight | null {
  if (!insights || insights.length === 0) return null;
  const priority = { critical: 3, warning: 2, suggestion: 1, info: 0 } as const;
  return [...insights].sort((a, b) => (priority[b.type] ?? 0) - (priority[a.type] ?? 0))[0] ?? null;
}

export function BudgetStabilityRiskCard({ daysUnderBudget, disciplineXp, insights, topInsightOverride }: Props) {
  const safeDays = typeof daysUnderBudget === "number" && daysUnderBudget >= 0 ? daysUnderBudget : 0;
  const xp = typeof disciplineXp === "number" && disciplineXp >= 0 ? disciplineXp : 0;
  const pct = Math.max(0, Math.min(100, (safeDays / 7) * 100));
  const top = topInsightOverride ?? pickTopInsight(insights);
  const isWarning = top?.type === "warning" || top?.type === "critical";

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Stabiliteit & risico</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Een wekelijkse stabiliteitscheck en het belangrijkste risicosignaal.
        </p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-[var(--text-muted)]">Dagen onder budget</p>
            <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{safeDays}/7</p>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
            <div
              className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">Discipline deze week: +{xp} XP.</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-[var(--text-muted)]">Prioriteitssignaal</p>
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              isWarning
                ? "border-amber-500/70 bg-amber-500/10 text-[var(--text-primary)]"
                : "border-[var(--card-border)] bg-[var(--bg-surface)]/60 text-[var(--text-primary)]"
            }`}
          >
            {top?.message ?? "Er zijn nu geen actieve risicosignalen."}
          </div>
          <Link href="/budget?tab=analysis" className="text-xs font-medium text-[var(--accent-focus)] hover:underline">
            Bekijk details in Analysis →
          </Link>
        </div>
      </div>
    </section>
  );
}
