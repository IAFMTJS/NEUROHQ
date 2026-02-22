"use client";

import Link from "next/link";

const DAY_NAMES = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

type Props = {
  bestDayOfWeek: number | null;
};

export function InsightsBehaviorCard({ bestDayOfWeek }: Props) {
  return (
    <section
      className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5"
      aria-label="Gedragspatronen"
    >
      <h2 className="hq-h2 mb-4">Gedragspatronen</h2>
      {bestDayOfWeek != null ? (
        <>
          <p className="hq-body mb-4 text-[var(--text-secondary)]">
            Je presteert het beste op <strong className="text-[var(--text-primary)]">{DAY_NAMES[bestDayOfWeek]}</strong>.
            Plan je zwaarste missies dan.
          </p>
          <Link
            href="/tasks"
            className="btn-hq-secondary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-2.5 px-4"
          >
            Gebruik dit voordeel
          </Link>
        </>
      ) : (
        <>
          <p className="hq-body mb-4 text-[var(--text-muted)]">
            Nog niet genoeg data om je beste prestatiedag te bepalen. Voltooi de komende dagen missies om inzichten te ontgrendelen.
          </p>
          <Link
            href="/tasks"
            className="btn-hq-secondary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-2.5 px-4"
          >
            Naar missies
          </Link>
        </>
      )}
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Heatmap per uur en drop-off patronen staan verderop op deze pagina.
      </p>
    </section>
  );
}
