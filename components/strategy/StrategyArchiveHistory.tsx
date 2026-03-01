"use client";

import type { StrategyFocusRow } from "@/app/actions/strategyFocus";

type Props = {
  past: StrategyFocusRow[];
};

export function StrategyArchiveHistory({ past }: Props) {
  if (past.length === 0) return null;

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Strategy archive
      </h2>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Afgesloten strategieën: thesis, target gehaald?, gemiddelde alignment, grootste fout/succes.
      </p>
      <ul className="mt-3 space-y-3">
        {past.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-card)]/50 p-3"
          >
            <p className="text-sm font-medium text-[var(--text-primary)]">{s.thesis}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
              {s.end_date && <span>Eind: {s.end_date}</span>}
              {s.target_metric && <span>Target: {s.target_metric}</span>}
              {(s as { archive_reason?: string | null }).archive_reason && (
                <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5">
                  {((s as { archive_reason: string }).archive_reason === "target_met" && "Target gehaald") ||
                    ((s as { archive_reason: string }).archive_reason === "alignment_ok" && "Alignment ok") ||
                    ((s as { archive_reason: string }).archive_reason === "alignment_fail" && "Alignment verloren") ||
                    (s as { archive_reason: string }).archive_reason}
                </span>
              )}
            </div>
            {(s as { archive_reason_note?: string | null }).archive_reason_note && (
              <p className="mt-1 text-xs text-[var(--text-muted)] italic">{(s as { archive_reason_note: string }).archive_reason_note}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
