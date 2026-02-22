"use client";

import type { TaskWithUMS } from "@/app/actions/missions-performance";
import { domainLabel } from "@/lib/strategyDomains";

type Props = {
  /** Top UMS task: "Wat moet ik NU doen?" */
  recommendation: TaskWithUMS | null;
  /** Optional subtitle e.g. "Gebaseerd op Unified Mission Score" */
  showUMSBreakdown?: boolean;
};

export function SmartRecommendationHero({ recommendation, showUMSBreakdown = false }: Props) {
  if (!recommendation) return null;

  const { umsBreakdown, title, domain } = recommendation;
  const umsPct = Math.round(umsBreakdown.ums * 100);
  const domainStr = domain ? domainLabel(domain) : null;

  return (
    <section
      className="rounded-xl border border-[var(--accent-focus)]/30 bg-[var(--accent-focus)]/10 p-4"
      aria-label="Smart recommendation"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent-focus)]/80">
        🔥 Wat moet ik NU doen?
      </p>
      <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
        {title ?? "Mission"}
      </h2>
      {domainStr && (
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">
          Domein: {domainStr} · UMS {umsPct}%
        </p>
      )}
      {showUMSBreakdown && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-[var(--text-muted)] sm:flex sm:flex-wrap sm:gap-x-6">
          <span>Alignment {Math.round(umsBreakdown.strategyAlignment * 100)}%</span>
          <span>Completion {Math.round(umsBreakdown.completionProbability * 100)}%</span>
          <span>ROI {Math.round(umsBreakdown.roi * 100)}%</span>
          <span>Energy match {Math.round(umsBreakdown.energyMatch * 100)}%</span>
          <span>Pressure {Math.round(umsBreakdown.pressureImpact * 100)}%</span>
        </div>
      )}
    </section>
  );
}
