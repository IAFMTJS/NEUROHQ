import Link from "next/link";

type Strategy = { primary_theme?: string | null; one_word?: string | null } | null;

type Props = { strategy: Strategy };

export function GrowthStrategyBanner({ strategy }: Props) {
  const label = strategy?.one_word || strategy?.primary_theme;
  if (!label) return null;
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-2">
      <p className="text-sm text-[var(--text-muted)]">
        This quarter: <span className="font-medium text-[var(--text-primary)]">{label}</span>.{" "}
        <Link href="/strategy" className="text-[var(--accent-focus)] hover:underline">
          Strategy →
        </Link>
      </p>
    </div>
  );
}
