type Past = { id: string; year: number; quarter: number; primary_theme: string | null; secondary_theme: string | null; identity_statement: string | null; one_word: string | null };

type Props = { past: Past[] };

export function StrategyPastQuarters({ past }: Props) {
  if (past.length === 0) return null;
  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Past quarters</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Previous strategies for reference.</p>
      </div>
      <div className="p-4">
        <ul className="space-y-3">
          {past.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-baseline gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2.5 text-sm"
            >
              <span className="font-medium text-[var(--text-primary)]">Q{s.quarter} {s.year}</span>
              {(s.one_word || s.primary_theme) && (
                <span className="text-[var(--text-muted)]">
                  — {[s.one_word, s.primary_theme, s.secondary_theme].filter(Boolean).join(" · ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
