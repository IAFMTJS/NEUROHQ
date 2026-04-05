"use client";

import { CommanderMascotPedestal } from "@/components/commander/CommanderMascotPedestal";
import { CommanderStatRing } from "@/components/commander/CommanderStatRing";
import { getDashboardMascotSrc } from "@/lib/mascots";
import { SegmentedBar } from "@/components/visual-lab/VisualLabBars";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";

const E = 68;
const F = 54;
const L = 43;

const PEDESTAL = {
  totalXP: 45_200,
  displayLevel: 12,
  budgetRemainingCents: 42_050,
  currency: "EUR",
  energyPct: E,
  focusPct: F,
  loadPct: L,
  energy1to10: 7,
  focus1to10: 5,
  load1to10: 4,
} as const;

/**
 * Één scherm: zelfde bouwstenen als productie-bridge — pedestal met boog + XP/budget op de band,
 * daaronder commander-rings, quote, wat-nu, primaire CTA. Compact geschaald zodat het op een laptop
 * als één snapshot leesbaar blijft.
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
            Dashboard · één scherm (productie-pariteit)
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Zelfde stack als live: <code className="rounded bg-black/25 px-1 text-[10px]">CommanderMascotPedestal</code> +
            rings + glass quote — hier bewust compact voor één viewport. Mock data.
          </p>
        </div>
        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Mock
        </span>
      </div>

      <VisualLabCommandDeck contentClassName="min-h-0 p-3 md:p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 md:max-h-[min(90vh,860px)] md:gap-2.5 md:overflow-hidden">
          <header className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-[rgba(var(--mode-rgb),0.12)] pb-2">
            <div className="min-w-0 border-l-2 border-[rgba(var(--semantic-accent),0.55)] pl-2.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Operator</p>
              <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)] md:text-base">Dashboard</h3>
              <p className="text-[10px] text-[var(--text-muted)]">System overview</p>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1 rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.5)] px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                Sync live
              </span>
              <span className="rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.5)] px-2 py-1">
                Focus
              </span>
            </div>
          </header>

          <div className="shrink-0 rounded-lg border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,10,18,0.45)] px-2 py-1.5 backdrop-blur-sm">
            <SegmentedBar
              label="Resource strip"
              caption={`E ${E}% · F ${F}% · L ${L}%`}
              fills={[E / 100, F / 100, L / 100]}
              segmentLabels={["Energy", "Focus", "Load"]}
            />
          </div>

          {/* Pedestal + mascot: productie-component; licht verkleind op desktop */}
          <div className="relative shrink-0 md:-mt-1 md:scale-[0.92] md:origin-top">
            <section
              className="mascot-hero mascot-hero-top relative w-full overflow-visible"
              data-commander-orbit="true"
            >
              <CommanderMascotPedestal stats={{ ...PEDESTAL }}>
                <div className="mascot-hero-mascot-stack relative mx-auto flex w-full justify-center">
                  <img src={getDashboardMascotSrc()} alt="" className="mascot-img" aria-hidden />
                </div>
              </CommanderMascotPedestal>
            </section>
          </div>

          <section className="stats commander-bridge-stats flex shrink-0 flex-wrap items-end justify-center gap-3 md:gap-5">
            <CommanderStatRing variant="energy" value={E} size={88} />
            <CommanderStatRing variant="focus" value={F} size={88} />
            <CommanderStatRing variant="load" value={L} size={88} />
          </section>

          <div className="glass-card glass-preserve-decoration mx-auto w-full max-w-lg shrink-0 !rounded-xl !px-3 !py-2 !shadow-none">
            <p
              className="mb-0.5 text-center text-[9px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "rgba(var(--mode-rgb), 0.78)" }}
            >
              Daily quote
            </p>
            <p className="text-center text-[11px] italic leading-snug text-[var(--text-primary)]">
              &ldquo;Kleine commit nu, compound later.&rdquo;
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-1.5 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(5,16,28,0.35)] p-2 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[rgba(var(--mode-rgb),0.1)]">
            <div className="px-2 py-1.5 sm:py-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--semantic-accent)]/90">Wat nu</p>
              <p className="mt-0.5 text-xs font-semibold leading-snug text-[var(--text-primary)]">
                Deep-work blok vóór 14:00
              </p>
            </div>
            <div className="px-2 py-1.5 sm:py-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Vandaag</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums leading-none text-[var(--text-primary)]">5</p>
              <p className="text-[9px] text-[var(--text-secondary)]">open</p>
            </div>
            <div className="px-2 py-1.5 sm:py-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-violet-300/85">Brain</p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-secondary)]">Check-in ok · zie ringen</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <button
              type="button"
              className="commander-cta-glass h-11 w-full rounded-full text-[11px] font-medium tracking-[0.08em] text-[var(--text-main)] sm:max-w-xs"
            >
              Naar missies (mock)
            </button>
            <ul className="hidden text-[10px] leading-snug text-[var(--text-muted)] sm:block sm:max-w-[14rem] sm:text-right">
              <li>· Inbox: 2 quick wins</li>
              <li>· Weektheme: execution</li>
            </ul>
          </div>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}
