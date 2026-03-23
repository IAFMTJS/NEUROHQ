import Link from "next/link";

type Props = {
  dropOffMessage: string | null;
  correlationSentence: string | null;
  comparativeSentence: string | null;
  frictionSentence: string | null;
};

type Signal = {
  key: string;
  label: string;
  sentence: string;
  href: string;
  cta: string;
};

export function InsightsPatternSignalsCard({
  dropOffMessage,
  correlationSentence,
  comparativeSentence,
  frictionSentence,
}: Props) {
  const signals: Signal[] = [
    dropOffMessage
      ? {
          key: "drop-off",
          label: "Drop-off patroon",
          sentence: dropOffMessage,
          href: "/tasks",
          cta: "Plan lichtere missies",
        }
      : null,
    correlationSentence
      ? {
          key: "correlation",
          label: "Correlatie",
          sentence: correlationSentence.replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
          href: "/dashboard",
          cta: "Check energie eerst",
        }
      : null,
    comparativeSentence
      ? {
          key: "comparative",
          label: "Vergelijking",
          sentence: comparativeSentence,
          href: "/strategy",
          cta: "Bekijk strategie",
        }
      : null,
    frictionSentence
      ? {
          key: "friction",
          label: "Frictie-detectie",
          sentence: frictionSentence,
          href: "/tasks",
          cta: "Start klein op moeilijke missies",
        }
      : null,
  ].filter((entry): entry is Signal => entry != null);

  if (signals.length === 0) return null;

  return (
    <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="Patroon-signalen">
      <h2 className="hq-h2 mb-1">Patroon-signalen</h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Samengevoegde inzichten over frictie, drop-off en vergelijkende prestaties.
      </p>

      <ul className="space-y-3">
        {signals.map((signal) => (
          <li
            key={signal.key}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/40 px-3 py-2.5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{signal.label}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{signal.sentence}</p>
            <Link
              href={signal.href}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-focus)] hover:underline"
            >
              {signal.cta}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
