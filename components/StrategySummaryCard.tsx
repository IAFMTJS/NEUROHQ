import Link from "next/link";

type Strategy = {
  primary_theme: string | null;
  secondary_theme: string | null;
  identity_statement: string | null;
  key_results: string | null;
  savings_goal_id: string | null;
  anti_goals?: string | null;
  one_word?: string | null;
  north_star?: string | null;
} | null;

type Goal = { id: string; name: string; current_cents?: number; target_cents?: number };

type Props = {
  strategy: Strategy;
  goals: Goal[];
  year: number;
  quarter: number;
};

function keyResultsList(text: string | null): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function StrategySummaryCard({ strategy, goals, year, quarter }: Props) {
  const hasTheme = strategy?.primary_theme || strategy?.secondary_theme;
  const hasIdentity = !!strategy?.identity_statement?.trim();
  const hasOneWord = !!strategy?.one_word?.trim();
  const hasNorthStar = !!strategy?.north_star?.trim();
  const hasAntiGoals = !!strategy?.anti_goals?.trim();
  const results = keyResultsList(strategy?.key_results ?? null);
  const linkedGoal = strategy?.savings_goal_id
    ? goals.find((g) => g.id === strategy!.savings_goal_id)
    : null;
  const hasContent = hasTheme || hasIdentity || hasOneWord || hasNorthStar || hasAntiGoals || results.length > 0 || linkedGoal;

  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Your strategy this quarter</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">Q{quarter} {year} at a glance</p>
      </div>
      <div className="space-y-4 p-4">
        {!hasContent ? (
          <div className="rounded-xl border border-dashed border-neuro-border bg-neuro-surface/50 px-4 py-6 text-center">
            <p className="text-sm text-neuro-muted">No strategy set yet.</p>
            <p className="mt-1 text-xs text-neuro-muted">Fill in themes, identity, and key results below to direct your quarter.</p>
          </div>
        ) : (
          <>
        {hasOneWord && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neuro-muted">One word</p>
            <p className="mt-1 text-sm font-semibold text-neuro-blue">{strategy?.one_word}</p>
          </div>
        )}
        {hasTheme && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neuro-muted">Themes</p>
            <p className="mt-1 text-sm text-neuro-silver">
              {[strategy?.primary_theme, strategy?.secondary_theme].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}
        {hasNorthStar && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neuro-muted">North star</p>
            <p className="mt-1 text-sm text-neuro-silver">{strategy?.north_star}</p>
          </div>
        )}
        {hasIdentity && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neuro-muted">Identity</p>
            <p className="mt-1 text-sm italic leading-relaxed text-neuro-silver">
              &ldquo;{strategy?.identity_statement}&rdquo;
            </p>
          </div>
        )}
        {results.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neuro-muted">Key results</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-neuro-silver">
              {results.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {hasAntiGoals && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neuro-muted">Anti-goals</p>
            <p className="mt-1 text-sm text-neuro-muted">{strategy?.anti_goals}</p>
          </div>
        )}
        {linkedGoal && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neuro-muted">Linked goal</p>
            <Link
              href="/budget"
              className="mt-1 inline-block text-sm font-medium text-neuro-blue hover:underline"
            >
              {linkedGoal.name}
              {linkedGoal.target_cents != null && linkedGoal.current_cents != null && linkedGoal.target_cents > 0
                ? ` — ${Math.min(100, Math.round(((linkedGoal.current_cents ?? 0) / linkedGoal.target_cents) * 100))}%`
                : ""}{" "}
              →
            </Link>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
