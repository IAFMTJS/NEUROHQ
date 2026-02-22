"use client";

import Link from "next/link";

type Props = { message: string | null };

export function InsightsDropOffCard(props: Props) {
  const { message } = props;
  if (!message) return null;
  return (
    <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="Drop-off patroon">
      <h2 className="hq-h2 mb-2">Drop-off patroon</h2>
      <p className="hq-body mb-4 text-[var(--text-secondary)]">{message}</p>
      <Link href="/tasks" className="btn-hq-secondary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-2.5 px-4">
        Plan lichtere missies
      </Link>
    </section>
  );
}
