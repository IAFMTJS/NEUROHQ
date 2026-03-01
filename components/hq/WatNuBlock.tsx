import Link from "next/link";

type Props = {
  /** First incomplete task for today; if null, CTA is assistant or "Bekijk vandaag". */
  firstTask: { id: string; title: string } | null;
  /** Energy 0–100 (from state). */
  energyPct: number;
  /** Optional: focus 0–100 for one-line copy. */
  focusPct?: number;
};

export function WatNuBlock({ firstTask, energyPct, focusPct = 50 }: Props) {
  const energyLine = `Energie ${energyPct}%`;
  const nextStep = firstTask
    ? firstTask.title
    : "Praat met assistant of kies een taak.";
  const ctaHref = firstTask ? "/tasks" : "/assistant";
  const ctaLabel = firstTask ? "Ga naar taken" : "Praat met assistant";

  return (
    <section
      className="card-simple-accent hq-card-enter p-5"
      style={{ animationDelay: "0ms" }}
      aria-label="Wat nu?"
    >
      <h2 className="hq-label mb-1 text-[var(--text-muted)]">Wat nu?</h2>
      <p className="hq-body mb-1 text-[var(--text-secondary)]">
        {energyLine}
        {focusPct >= 70 && " · Focus piek"}
      </p>
      <p className="hq-body mb-4 text-[var(--text-primary)]">
        {firstTask ? `Volgende stap: ${firstTask.title}` : nextStep}
      </p>
      <Link
        href={ctaHref}
        className="btn-hq-primary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-3 px-4 text-[14px]"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}
