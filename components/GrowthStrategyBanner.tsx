import Link from "next/link";

type Strategy = { primary_theme?: string | null; one_word?: string | null } | null;

type Props = { strategy: Strategy };

export function GrowthStrategyBanner({ strategy }: Props) {
  const label = strategy?.one_word || strategy?.primary_theme;
  if (!label) return null;
  return (
    <div className="rounded-xl border border-neuro-border bg-neuro-surface/50 px-4 py-2">
      <p className="text-sm text-neuro-muted">
        This quarter: <span className="font-medium text-neuro-silver">{label}</span>.{" "}
        <Link href="/strategy" className="text-neuro-blue hover:underline">
          Strategy →
        </Link>
      </p>
    </div>
  );
}
