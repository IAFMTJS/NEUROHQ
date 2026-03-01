"use client";

import { useState } from "react";
import type { Quote } from "@/types/database.types";
import type { AppMode } from "@/app/actions/mode";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";

type QuoteWithDay = { quote: Quote | null; day: number };

const MODE_LABELS: Record<AppMode, string> = {
  normal: "",
  low_energy: "Low energy — we suggest fewer, lighter tasks.",
  high_sensory: "High sensory load — minimal UI.",
  driven: "Driven mode — high-impact tasks first.",
  stabilize: "Stabilize mode — steady pace. Finish or reschedule when you can.",
};

type Props = {
  prev: QuoteWithDay;
  current: QuoteWithDay;
  next: QuoteWithDay;
  mode: AppMode;
  identityStatement: string | null;
};

/** One card combining Quote of the day, Mode banner, and Quarter strategy. */
export function DashboardContextCard({
  prev,
  current,
  next,
  mode,
  identityStatement,
}: Props) {
  const [view, setView] = useState<"prev" | "current" | "next">("current");
  const active = view === "prev" ? prev : view === "next" ? next : current;

  return (
    <SciFiPanel className="overflow-hidden" bodyClassName="p-0">
      {/* Quote */}
      <section className="border-b border-[var(--card-border)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Quote · Dag {active.day} van 365
            </p>
            {active.quote ? (
              <>
                <p className="mt-1 line-clamp-2 text-sm italic text-[var(--text-primary)]">
                  &ldquo;{active.quote.quote_text}&rdquo;
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  — {active.quote.author_name}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-[var(--text-muted)]">Geen quote voor vandaag.</p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setView("prev")}
              disabled={view === "prev"}
              className="dashboard-hud-nav-btn rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-40"
              aria-label="Vorige quote"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setView("next")}
              disabled={view === "next"}
              className="dashboard-hud-nav-btn rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-40"
              aria-label="Volgende quote"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* Mode */}
      {mode !== "normal" && MODE_LABELS[mode] && (
        <section className="border-b border-[var(--card-border)] px-4 py-2.5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Modus vandaag</p>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-focus)]" aria-hidden />
            {MODE_LABELS[mode]}
          </p>
        </section>
      )}

      {/* Quarter */}
      {identityStatement && (
        <section className="px-4 py-3">
          <p className="text-xs font-medium text-[var(--text-muted)]">Dit kwartaal</p>
          <p className="mt-1 text-sm italic text-[var(--text-secondary)]">
            &ldquo;{identityStatement}&rdquo;
          </p>
        </section>
      )}
    </SciFiPanel>
  );
}
