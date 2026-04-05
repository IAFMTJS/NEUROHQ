"use client";

import { STRATEGY_TAB_ITEMS } from "@/components/strategy/StrategyTabsShell";
import { StrategyAnalysisSplitRing } from "@/components/strategy/StrategyAnalysisSplitRing";
import { SegmentedBar } from "@/components/visual-lab/VisualLabBars";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";
import { tasksDeckTabClass } from "@/components/missions/tasksDeckTabClass";

const THESIS = "Buffer opbouwen en execution discipline verdiepen dit kwartaal.";
const WHY = "Minder impuls, meer herhaalbaar ritme — de engine moet kunnen vertragen zonder momentum te verliezen.";

/**
 * One balanced strategy screen: clear IA (thesis, engine, allocation, next steps),
 * production-like components where it helps, no competing “concept A/B/C” blocks.
 */
export function VisualLabStrategyBalancedConcept() {
  return (
    <section
      className="relative mb-10 scroll-mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.18)] p-3 md:p-4"
      aria-labelledby="vl-strategy-balanced-heading"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-[rgba(var(--mode-rgb),0.1)] pb-3">
        <div>
          <h2
            id="vl-strategy-balanced-heading"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
          >
            Strategy · visueel + layout + functioneel
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Eén samenhangend scherm: tab-rail (zelfde labels als /strategy), thesis en druk links, budget/growth-ring en
            kwartaal-KPIs rechts, allocatiebalk en duidelijke vervolgstappen onderaan. Mock data.
          </p>
        </div>
        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Mock
        </span>
      </div>

      <VisualLabCommandDeck contentClassName="min-h-0 gap-0 p-3 md:p-4">
        {/* Nav: toont informatiearchitectuur (geen lege tab-panelen) */}
        <nav
          className="mb-3 flex flex-wrap gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(4,12,22,0.5)] p-1"
          aria-label="Strategie-secties (statische referentie, zelfde labels als productie)"
        >
          {STRATEGY_TAB_ITEMS.map((t, i) => (
            <span
              key={t.id}
              className={`${tasksDeckTabClass(i === 0)} pointer-events-none cursor-default`}
            >
              {t.shortLabel}
            </span>
          ))}
        </nav>
        <p className="mb-3 text-[10px] text-[var(--text-muted)]">
          Rail volgt productie; inhoud hieronder is bewust op één scherm gezet zodat je structuur en visuals tegelijk beoordeelt.
        </p>

        <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
          {/* Linkerkolom: thesis + druk */}
          <div className="space-y-3 lg:col-span-5">
            <div className="rounded-[20px] border border-[var(--card-border)] bg-[var(--bg-elevated)]/90 p-4 shadow-[var(--shadow-card)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Strategic thesis
              </p>
              <p className="mt-2 text-sm font-semibold leading-snug text-[var(--text-primary)] md:text-base">{THESIS}</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{WHY}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md border border-[var(--card-border)] bg-[var(--bg-card)] px-2 py-1 text-[11px] text-[var(--text-primary)]">
                  Deadline: 47 dagen (mock)
                </span>
                <span className="rounded-md border border-[var(--card-border)] bg-[var(--bg-card)] px-2 py-1 text-[11px] text-[var(--text-primary)]">
                  Target: spaar +12% leer
                </span>
              </div>
            </div>

            <div className="rounded-[20px] border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(5,18,32,0.55)] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Strategic pressure
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div
                  className="relative h-24 w-9 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(4,10,18,0.65)]"
                  style={{ boxShadow: "inset 0 0 12px rgba(0,0,0,0.35)" }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-[var(--accent-focus)] to-emerald-400/85"
                    style={{ height: "55%" }}
                    aria-hidden
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--accent-focus)]">Normaal</p>
                  <p className="mt-1 text-[11px] leading-snug text-[var(--text-secondary)]">
                    Druk binnen gezonde band. Bij risico verschuift zone naar amber/rood zoals op productie.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rechterkolom: split ring + kwartaal KPIs */}
          <div className="space-y-3 lg:col-span-7">
            <div className="relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.2)] bg-gradient-to-br from-[rgba(8,26,42,0.92)] via-[var(--bg-elevated)]/88 to-[rgba(var(--mode-rgb-deep),0.2)] px-4 py-5 md:px-6">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_0%,rgba(var(--mode-rgb),0.12),transparent_55%)]"
                aria-hidden
              />
              <div className="relative flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <StrategyAnalysisSplitRing budgetHealth={64} growthHealth={78} budgetWarn={false} growthWarn={false} />
                <div className="max-w-[200px] text-[10px] leading-relaxed text-[var(--text-secondary)] sm:text-left">
                  Budget vs growth health — zelfde component als in de echte strategy-analyse. Hier als visueel anker naast
                  kwartaalcijfers.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { k: "Growth", v: "78%", sub: "protocol" },
                { k: "Budget", v: "64%", sub: "spaar" },
                { k: "XP", v: "52%", sub: "vs doel" },
                { k: "Executie", v: "71%", sub: "taken" },
              ].map((row) => (
                <div
                  key={row.k}
                  className="rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,18,30,0.5)] px-2.5 py-2.5 text-center backdrop-blur-sm"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">{row.k}</p>
                  <p className="mt-1 text-base font-bold tabular-nums text-[var(--text-primary)]">{row.v}</p>
                  <p className="text-[9px] text-[var(--text-muted)]">{row.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Functionele onderbalk: allocatie + acties */}
        <div className="mt-4 space-y-3 border-t border-[rgba(var(--mode-rgb),0.12)] pt-4">
          <SegmentedBar
            label="Weekly allocation (mock)"
            caption="Zelfde datatype als echte sliders — hier alleen leesbaar viz"
            fills={[0.44, 0.36, 0.2]}
            segmentLabels={["Werk", "Leer", "Recovery"]}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              className="rounded-xl border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.28)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-focus)]"
            >
              Kwartaal contract (mock)
            </button>
            <button
              type="button"
              className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-100/95"
            >
              Weekreview starten (mock)
            </button>
            <span className="text-center text-[10px] text-[var(--text-muted)] sm:text-right">
              Twee primaire flows blijven zichtbaar: contract vastleggen en review ritme.
            </span>
          </div>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}
