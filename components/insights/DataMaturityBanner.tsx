import type { UserDataMaturity } from "@/lib/user-data-maturity";

type Props = {
  maturity: UserDataMaturity;
  message: string;
};

/** Transparency strip: how strongly Insights/Missions use personal completion history. */
export function DataMaturityBanner({ maturity, message }: Props) {
  const tone =
    maturity === "sparse"
      ? "border-[var(--card-border)]/80 bg-[var(--bg-surface)]/35 text-[var(--text-muted)]"
      : maturity === "enough"
        ? "border-[var(--accent-focus)]/35 bg-[var(--accent-focus)]/10 text-[var(--text-secondary)]"
        : "border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/15 text-[var(--text-primary)]";

  return (
    <aside
      className={`rounded-xl border px-4 py-3 text-sm leading-snug ${tone}`}
      aria-label="Persoonlijke data"
    >
      {message}
    </aside>
  );
}
