"use client";

import type { FC } from "react";

type Props = {
  /** 0–100 discipline score */
  value: number | null | undefined;
  /** False when user has no budget entries and no monthly budget — avoids misleading 0/100 Critical */
  inputsReady?: boolean;
};

function getDisciplineLabel(score: number) {
  if (score >= 80) return "Stabiel";
  if (score >= 60) return "Aflopend";
  return "Kritiek";
}

const disciplineShell =
  "relative overflow-hidden rounded-[var(--hq-card-radius,18px)] border border-[rgba(var(--mode-rgb),0.09)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.18)] via-[var(--bg-elevated)]/10 to-[var(--bg-primary)]/24 shadow-[0_10px_40px_rgba(0,0,0,0.3),0_0_24px_rgba(var(--mode-rgb),0.04)] backdrop-blur-xl";

const innerTile =
  "rounded-xl border border-[rgba(var(--mode-rgb),0.08)] bg-[rgba(var(--mode-rgb-deep),0.08)] px-3 py-3";

export const DisciplineIndexCard: FC<Props> = ({ value, inputsReady = true }) => {
  const safeValue = typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
  const showInsufficient =
    !inputsReady && safeValue !== null && safeValue === 0;

  return (
    <section className={disciplineShell} aria-label="Discipline-index">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(var(--mode-rgb),0.1),transparent_55%)]"
        aria-hidden
      />
      <div className="relative z-[1] border-b border-[rgba(var(--mode-rgb),0.1)] px-4 py-3 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">Signalen</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--text-primary)]">Discipline-index</h2>
        <p className="mt-1 max-w-xl text-xs leading-snug text-[var(--text-muted)]">
          Gecombineerd signaal: budget, impuls, log-consistentie en weekreviews.
        </p>
      </div>
      <div className="relative z-[1] p-4 sm:p-5">
        {safeValue == null ? (
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">Nog geen discipline-score beschikbaar.</p>
        ) : showInsufficient ? (
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            Stel een maandbudget in en log minstens één uitgave of inkomsten om een betrouwbare score te zien.
          </p>
        ) : (
          <div className={innerTile}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Score</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">{safeValue}/100</p>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(var(--mode-rgb),0.12)]">
                <div
                  className="h-full rounded-full bg-[var(--accent-focus)] transition-all duration-300"
                  style={{ width: `${safeValue}%` }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Status:{" "}
                <span className="font-semibold text-[var(--text-secondary)]">{getDisciplineLabel(safeValue)}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

