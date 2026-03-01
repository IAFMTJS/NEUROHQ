"use client";

type Props = {
  /** First key result or primary theme to focus on this week */
  focusText: string | null;
  identityStatement: string | null;
};

export function StrategyFocusBlock({ focusText, identityStatement }: Props) {
  const display = focusText?.trim() || identityStatement?.trim();
  if (!display) return null;

  return (
    <section className="rounded-xl border border-[var(--accent-focus)]/40 bg-[var(--accent-focus)]/10 px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Focus deze week
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-primary)]">
        {display}
      </p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        Kies één key result of thema om prioriteit te geven; dat maakt je strategie tot succes.
      </p>
    </section>
  );
}
