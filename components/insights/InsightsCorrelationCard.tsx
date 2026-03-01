"use client";

import Link from "next/link";

type Props = { sentence: string | null };

export function InsightsCorrelationCard({ sentence }: Props) {
  if (!sentence) return null;
  return (
    <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="Correlatie">
      <h2 className="hq-h2 mb-2">Correlatie</h2>
      <p className="hq-body mb-4 text-[var(--text-secondary)]">{sentence.replace(/&lt;/g, "<").replace(/&gt;/g, ">")}</p>
      <Link href="/dashboard" className="btn-hq-secondary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-2.5 px-4">
        Check energie eerst
      </Link>
    </section>
  );
}
