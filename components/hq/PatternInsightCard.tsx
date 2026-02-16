"use client";

import Link from "next/link";

type Props = {
  insight: string;
  detailsHref?: string;
  suggestion?: string | null;
};

export function PatternInsightCard({
  insight,
  detailsHref = "/report",
  suggestion,
}: Props) {
  return (
    <section
      className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5"
      style={{ animationDelay: "150ms" }}
      aria-label="Patterns Insight"
    >
      <h2 className="hq-h2 mb-4">Patterns Insight</h2>
      <p className="hq-body hq-body-lg mb-4">{insight}</p>
      {suggestion && (
        <p className="mb-4 rounded-lg border border-[var(--accent-focus)]/30 bg-[var(--accent-focus)]/5 px-3 py-2 text-sm text-[var(--text-secondary)]">
          💡 {suggestion}
        </p>
      )}
      <Link
        href={detailsHref}
        className="btn-hq-secondary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-2.5 px-4"
      >
        DETAILS
      </Link>
    </section>
  );
}
