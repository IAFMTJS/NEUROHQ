"use client";

import { CommanderStatRing } from "@/components/commander/CommanderStatRing";
import { getDashboardMascotSrc } from "@/lib/mascots";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";

const E = 68;
const F = 54;
const L = 43;

/**
 * Single viewport-oriented dashboard mock: everything visible at once on a
 * typical laptop without scrolling inside the deck (mobile may stack).
 */
export function VisualLabDashboardOneScreenConcept() {
  return (
    <section
      className="relative mb-10 scroll-mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.18)] p-3 md:p-4"
      aria-labelledby="vl-dash-one-screen-heading"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-[rgba(var(--mode-rgb),0.1)] pb-3">
        <div>
          <h2
            id="vl-dash-one-screen-heading"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
          >
            Dashboard · één scherm, één view
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Alles wat je op het echte dashboard nodig hebt in één overzicht: mascotte, brain-rings, wat nu,
            vandaag-stack, korte context — zonder lange verticale concept-stapels. Mock data.
          </p>
        </div>
        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Mock
        </span>
      </div>

      <VisualLabCommandDeck contentClassName="min-h-0 p-3 md:p-4">
        <div className="flex max-h-none flex-col gap-3 md:max-h-[min(88vh,820px)] md:overflow-hidden">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[rgba(var(--mode-rgb),0.12)] pb-2">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">HQ</p>
              <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)] md:text-base">Dashboard</h3>
              <p className="text-[10px] text-[var(--text-muted)]">System overview</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { k: "Sync", v: "Live", ok: true },
                { k: "Mode", v: "Focus", ok: true },
              ].map((x) => (
                <span
                  key={x.k}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.5)] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${x.ok ? "bg-emerald-400" : "bg-amber-400"}`} aria-hidden />
                  {x.k}: {x.v}
                </span>
              ))}
            </div>
          </header>

          <div className="relative grid min-h-0 shrink-0 gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(5,16,28,0.45)] p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4 md:p-4">
            <div
              className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_70%_80%_at_50%_100%,rgba(var(--mode-rgb),0.18),transparent_65%)]"
              aria-hidden
            />
            <div className="relative z-[1] flex max-h-[200px] items-end justify-center md:max-h-[240px] md:justify-start">
              <img
                src={getDashboardMascotSrc()}
                alt=""
                className="mascot-img max-h-[180px] w-auto max-w-[min(240px,70vw)] object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.45)] md:max-h-[220px]"
                aria-hidden
              />
            </div>
            <div className="relative z-[1] flex flex-wrap items-end justify-center gap-4 md:flex-nowrap md:justify-end md:pr-2">
              <CommanderStatRing variant="energy" value={E} size={76} />
              <CommanderStatRing variant="focus" value={F} size={76} />
              <CommanderStatRing variant="load" value={L} size={76} />
            </div>
          </div>

          <div className="grid min-h-0 shrink-0 grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="glass-card !rounded-xl !p-3 !shadow-none">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--semantic-accent)]/90">Wat nu</p>
              <p className="mt-1 line-clamp-2 text-xs font-semibold text-[var(--text-primary)]">
                Deep-work blok plannen vóór 14:00
              </p>
            </div>
            <div className="glass-card !rounded-xl !p-3 !shadow-none">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Vandaag</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">5</p>
              <p className="text-[10px] text-[var(--text-secondary)]">open taken · mock</p>
            </div>
            <div className="glass-card !rounded-xl !p-3 !shadow-none">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-violet-300/85">Brain status</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Check-in gedaan · energie / focus / load hierboven
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="commander-cta-glass rounded-full px-5 py-2.5 text-center text-[11px] font-medium tracking-[0.08em] text-[var(--text-main)] sm:min-w-[200px]"
            >
              Naar missies (mock)
            </button>
            <p className="text-center text-[10px] leading-snug text-[var(--text-muted)] sm:max-w-[55%] sm:text-right">
              Eén view = minder scroll tussen held, stats en actie — geschikt als je het dashboard als command snapshot wilt.
            </p>
          </div>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}
