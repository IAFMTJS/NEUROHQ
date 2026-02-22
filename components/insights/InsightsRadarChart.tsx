"use client";

import Link from "next/link";
import { domainLabel } from "@/lib/strategyDomains";

type Props = { data: { domain: string; score: number }[] };

export function InsightsRadarChart({ data }: Props) {
  if (!data?.length) return null;
  const max = Math.max(100, ...data.map((d) => d.score));
  return (
    <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="Sterkte vs zwakte per domein">
      <h2 className="hq-h2 mb-4">Sterkte vs zwakte (domeinen)</h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">Completion rate per focusdomein (laatste 30 dagen).</p>
      <div className="flex flex-wrap gap-3">
        {data.map(({ domain, score }) => (
          <div key={domain} className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-3 py-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">{domainLabel(domain)}</span>
            <span className="text-sm tabular-nums text-[var(--accent-focus)]">{score}%</span>
            <div className="h-2 w-16 overflow-hidden rounded-full bg-[var(--bg-overlay)]">
              <div className="h-full rounded-full bg-[var(--accent-focus)]" style={{ width: `${(score / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <Link href="/strategy" className="mt-4 inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] border border-[var(--card-border)] py-2.5 px-4 text-sm font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10">
        Bekijk strategie
      </Link>
    </section>
  );
}
