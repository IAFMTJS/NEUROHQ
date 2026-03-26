"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/Modal";

type SectionId = "level" | "dcic" | "today" | "system";

type Section = {
  id: SectionId;
  title: string;
  subtitle: string;
  icon: string;
  content: React.ReactNode;
};

type Props = {
  sections: Section[];
};

export function SystemOverviewCard({ sections }: Props) {
  const [openSectionId, setOpenSectionId] = useState<SectionId | null>(null);
  const openSection = useMemo(
    () => sections.find((section) => section.id === openSectionId) ?? null,
    [openSectionId, sections]
  );

  return (
    <>
      <section className="card-simple rounded-[var(--cmd-card-radius)] p-4 md:p-5" aria-label="Command dashboard systeemoverzicht">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Command dashboard
            </p>
            <h2 className="mt-1 text-base font-semibold text-[var(--text-primary)]">Systeemoverzicht</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Open een module voor detail en acties.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setOpenSectionId(section.id)}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/40 px-3 py-3 text-left hover:bg-[var(--bg-hover)]"
            >
              <p className="text-lg" aria-hidden>
                {section.icon}
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--text-primary)]">{section.title}</p>
              <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{section.subtitle}</p>
            </button>
          ))}
        </div>
      </section>
      <Modal
        open={openSection != null}
        onClose={() => setOpenSectionId(null)}
        title={openSection?.title ?? "Systeemoverzicht"}
        subtitle={openSection?.subtitle}
        size="lg"
      >
        {openSection?.content ?? null}
      </Modal>
    </>
  );
}

