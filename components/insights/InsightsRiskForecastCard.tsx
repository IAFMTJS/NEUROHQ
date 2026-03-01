"use client";

import Link from "next/link";

type Props = {
  levelProjectionDays: number | null;
  streakRiskLevel: "low" | "medium" | "high";
  streakRiskScore: number;
  /** Optional: expected XP next 7 days (velocity × 7) for prediction line */
  expectedXPNext7?: number;
};

const riskStyles: Record<"low" | "medium" | "high", string> = {
  low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  high: "bg-red-500/20 text-red-300 border-red-500/40",
};

export function InsightsRiskForecastCard({
  levelProjectionDays,
  streakRiskLevel,
  streakRiskScore,
  expectedXPNext7,
}: Props) {
  return (
    <section
      className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5"
      aria-label="Voorspelling en risico"
    >
      <h2 className="hq-h2 mb-4">Voorspelling & risico</h2>
      <div className="space-y-4">
        {levelProjectionDays != null && levelProjectionDays > 0 ? (
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2">
            <p className="text-xs font-medium text-[var(--text-muted)]">Level-prognose</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              Op dit tempo bereik je het volgende level binnen <strong>{levelProjectionDays}</strong> dagen.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2">
            <p className="text-xs font-medium text-[var(--text-muted)]">Level-prognose</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Voltooi meer missies om een schatting te krijgen.
            </p>
          </div>
        )}
        {expectedXPNext7 != null && expectedXPNext7 >= 0 && (
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2">
            <p className="text-xs font-medium text-[var(--text-muted)]">Verwacht komende 7 dagen</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">~{Math.round(expectedXPNext7)} XP</p>
            <p className="text-xs text-[var(--text-muted)]">Op basis van je huidige velocity.</p>
          </div>
        )}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2">
          <p className="text-xs font-medium text-[var(--text-muted)]">Streak-risico</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-flex rounded-lg border px-2 py-0.5 text-sm font-medium ${riskStyles[streakRiskLevel]}`}
            >
              {streakRiskLevel === "high" ? "Hoog" : streakRiskLevel === "medium" ? "Medium" : "Laag"}
            </span>
            <span className="text-sm text-[var(--text-muted)]">({streakRiskScore}/100)</span>
          </div>
          {streakRiskLevel === "high" && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Eén missie vandaag verlaagt het risico op een streak-breuk.
            </p>
          )}
        </div>
      </div>
      <Link
        href="/tasks"
        className="btn-hq-secondary mt-4 inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-2.5 px-4"
      >
        Herstel streak
      </Link>
    </section>
  );
}
