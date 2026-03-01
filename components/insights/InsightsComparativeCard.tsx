"use client";

import Link from "next/link";

type Props = {
  sentence: string | null;
};

export function InsightsComparativeCard({ sentence }: Props) {
  if (!sentence) return null;
  return (
    <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="Vergelijking">
      <h2 className="hq-h2 mb-2">Vergelijking</h2>
      <p className="hq-body mb-4 text-[var(--text-secondary)]">{sentence}</p>
      <Link href="/report" className="btn-hq-secondary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-2.5 px-4">
        Meer insights
      </Link>
    </section>
  );
}
