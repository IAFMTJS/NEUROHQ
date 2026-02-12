import Link from "next/link";

type Strategy = {
  primary_theme: string | null;
  secondary_theme: string | null;
  identity_statement: string | null;
  key_results: string | null;
  savings_goal_id: string | null;
} | null;

type Goal = { id: string; name: string };

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
  const results = keyResultsList(strategy?.key_results ?? null);
  const linkedGoal = strategy?.savings_goal_id
    ? goals.find((g) => g.id === strategy!.savings_goal_id)
    : null;
  const hasContent = hasTheme || hasIdentity || results.length > 0 || linkedGoal;

  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Your strategy this quarter</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">Q{quarter} {year} at a glance</p>
      </div>
      <div className="space-y-4 p-4">
        {!hasContent ? (
          <p className="text-sm text-neuro-muted">No strategy set yet. Fill in the form below and save.</p>
        ) : (
          <>
        {hasTheme && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neuro-muted">Themes</p>
            <p className="mt-1 text-sm text-neuro-silver">
              {[strategy.primary_theme, strategy.secondary_theme].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}
        {hasIdentity && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neuro-muted">Identity</p>
            <p className="mt-1 text-sm italic leading-relaxed text-neuro-silver">
              &ldquo;{strategy.identity_statement}&rdquo;
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
        {linkedGoal && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neuro-muted">Linked goal</p>
            <Link
              href="/budget"
              className="mt-1 inline-block text-sm font-medium text-neuro-blue hover:underline"
            >
              {linkedGoal.name} →
            </Link>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
