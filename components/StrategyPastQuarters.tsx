type Past = { id: string; year: number; quarter: number; primary_theme: string | null; secondary_theme: string | null; identity_statement: string | null; one_word: string | null };

type Props = { past: Past[] };

export function StrategyPastQuarters({ past }: Props) {
  if (past.length === 0) return null;
  return (
    <div className="rounded-xl border border-neuro-border bg-neuro-surface/50 px-4 py-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neuro-muted">Past quarters</p>
      <ul className="space-y-2 text-sm">
        {past.map((s) => (
          <li key={s.id} className="flex flex-wrap items-baseline gap-2">
            <span className="font-medium text-neuro-silver">Q{s.quarter} {s.year}</span>
            {(s.one_word || s.primary_theme) && (
              <span className="text-neuro-muted">
                — {[s.one_word, s.primary_theme, s.secondary_theme].filter(Boolean).join(" · ")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
