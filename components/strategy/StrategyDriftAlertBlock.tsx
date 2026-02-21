"use client";

type Props = {
  message: string;
  pctOff: number;
};

export function StrategyDriftAlertBlock({ message, pctOff }: Props) {
  return (
    <section className="rounded-xl border border-[var(--accent-amber)]/50 bg-[var(--accent-amber)]/10 px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-amber)]">
        Drift alert
      </h2>
      <p className="mt-2 text-sm text-[var(--text-primary)]">
        {message}
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Geen drama. Gewoon waarheid. Drie opeenvolgende dagen: werkelijk ≠ gepland.
      </p>
    </section>
  );
}
