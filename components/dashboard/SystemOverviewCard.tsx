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
  compact?: boolean;
};

export function SystemOverviewCard({ sections, compact = false }: Props) {
  const [openSectionId, setOpenSectionId] = useState<SectionId | null>(null);
  const openSection = useMemo(
    () => sections.find((section) => section.id === openSectionId) ?? null,
    [openSectionId, sections]
  );

  return (
    <>
      <section
        className={
          compact
            ? "flex shrink-0 flex-col justify-start gap-2 self-stretch py-0.5"
            : "card-simple rounded-[var(--cmd-card-radius)] p-4 md:p-5"
        }
        aria-label="Command dashboard systeemoverzicht"
      >
        {!compact && (
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
        )}
        <div
          className={`${
            compact
              ? "flex flex-col items-center gap-2"
              : "mt-4 grid grid-cols-4 gap-2"
          }`}
        >
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setOpenSectionId(section.id)}
              title={section.title}
              aria-label={section.title}
              aria-pressed={openSectionId === section.id}
              className={`rounded-xl border text-left transition-all ${
                compact
                  ? "h-10 w-10 shrink-0 p-0 text-center border-cyan-400/30 bg-cyan-500/10 shadow-[0_0_10px_rgba(34,211,238,0.2)] hover:bg-cyan-400/20 hover:shadow-[0_0_14px_rgba(34,211,238,0.34)] data-[pressed=true]:bg-cyan-300/25 data-[pressed=true]:border-cyan-300/60 data-[pressed=true]:shadow-[0_0_16px_rgba(34,211,238,0.42)]"
                  : "border-[var(--card-border)] bg-[var(--bg-surface)]/40 px-3 py-3 hover:bg-[var(--bg-hover)]"
              }`}
              data-pressed={openSectionId === section.id ? "true" : "false"}
            >
              <p className={`${compact ? "text-base leading-10" : "text-lg"}`} aria-hidden>
                {section.icon}
              </p>
              {compact ? (
                <span className="sr-only">{section.title}</span>
              ) : (
                <>
                  <p className="mt-1 text-[11px] font-semibold text-[var(--text-primary)]">{section.title}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{section.subtitle}</p>
                </>
              )}
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

