"use client";

import { useState } from "react";
import Link from "next/link";
import { CornerNode } from "@/components/hud-test/CornerNode";
import {
  STRATEGY_TAB_ITEMS,
  type StrategyTabId,
} from "@/components/strategy/StrategyTabsShell";
import { StrategyAnalysisSplitRing } from "@/components/strategy/StrategyAnalysisSplitRing";
import { SegmentedBar } from "@/components/visual-lab/VisualLabBars";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";
import { tasksDeckTabClass } from "@/components/missions/tasksDeckTabClass";

const THESIS =
  "Buffer opbouwen en execution discipline verdiepen — het kwartaal is de maatstaf.";
const WHY = "Minder impuls, meer herhaalbaar ritme.";

function statusDot(pct: number, committed: boolean) {
  if (!committed) return "bg-[var(--text-muted)]/50";
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 60) return "bg-amber-400";
  return "bg-red-500/90";
}

const MOCK_DRIVERS = [
  { key: "growth", label: "Growth", sub: "Protocol W3 · 4/5", pct: 78, committed: true },
  { key: "budget", label: "Budget", sub: "Spaardoel Q", pct: 64, committed: true },
  { key: "xp", label: "XP", sub: "Vs doel", pct: 52, committed: true },
  { key: "discipline", label: "Executie", sub: "Missie-log", pct: 71, committed: true },
] as const;

const ALIGN_WEEKS = [58, 62, 55, 70, 68, 64, 72];

/**
 * Werkende tab-rail + vaste analyse-kolom: voelt als echte hub, niet als statische poster.
 */
export function VisualLabStrategyBalancedConcept() {
  const [tab, setTab] = useState<StrategyTabId>("overview");

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
            Strategy — hub met echte rail
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Tabs wisselen inhoud; split-ring blijft als vaste &ldquo;health scan&rdquo; op breed scherm. Thesis altijd
            zichtbaar als noordster. Mock data.
          </p>
        </div>
        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Mock
        </span>
      </div>

      <VisualLabCommandDeck contentClassName="min-h-0 gap-0 p-3 md:p-4">
        <nav
          className="mb-2 flex flex-wrap gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(4,12,22,0.5)] p-1"
          aria-label="Strategie-secties"
        >
          {STRATEGY_TAB_ITEMS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={tasksDeckTabClass(tab === t.id)}
            >
              {t.shortLabel}
            </button>
          ))}
        </nav>

        <p className="mb-3 line-clamp-2 border-b border-[rgba(var(--mode-rgb),0.08)] pb-2 text-[11px] font-medium leading-snug text-[var(--text-primary)]">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Thesis · </span>
          {THESIS}
        </p>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1 space-y-3">
            {tab === "overview" && (
              <div
                className="rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-card)] sm:p-5"
                role="tabpanel"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Strategy score · Q2 2026
                    </p>
                    <p className="mt-0.5 font-mono text-3xl font-bold tabular-nums text-[var(--text-primary)] sm:text-4xl">
                      74<span className="text-base font-semibold text-[var(--text-muted)]">%</span>
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">Blijf tempo houden.</p>
                  </div>
                  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-2 text-[10px] text-[var(--text-secondary)]">
                    <p className="font-semibold text-[var(--text-primary)]">Contract</p>
                    <p className="mt-1 leading-snug">Vier pijlers à 25% — stel floors in onderaan.</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {MOCK_DRIVERS.map((d) => (
                    <div
                      key={d.key}
                      className="flex min-w-[9.5rem] shrink-0 flex-col gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-black/5 px-2.5 py-2 dark:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot(d.pct, d.committed)}`} aria-hidden />
                        <span className="text-[11px] font-semibold text-[var(--text-primary)]">{d.label}</span>
                      </div>
                      <span className="font-mono text-lg font-bold tabular-nums text-[var(--text-primary)]">{d.pct}%</span>
                      <span className="line-clamp-2 text-[9px] text-[var(--text-muted)]">{d.sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "focus" && (
              <div className="space-y-3 rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-card)]" role="tabpanel">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Weekly allocation
                </p>
                <SegmentedBar
                  label="Allocatie"
                  caption="Mock verdeling — in productie koppel je sliders"
                  fills={[0.44, 0.36, 0.2]}
                  segmentLabels={["Werk", "Leer", "Recovery"]}
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded-lg border border-[rgba(var(--semantic-accent),0.35)] bg-[rgba(var(--mode-rgb-deep),0.15)] px-2.5 py-1 text-[11px] font-semibold text-[var(--semantic-accent)]">
                    Primair Werk ×1.2
                  </span>
                  <span className="rounded-lg border border-[rgba(var(--mode-rgb),0.15)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                    Leer ×1.0
                  </span>
                  <span className="rounded-lg border border-[rgba(var(--mode-rgb),0.15)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                    Recovery ×0.9
                  </span>
                </div>
              </div>
            )}

            {tab === "alignment" && (
              <div className="rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-card)]" role="tabpanel">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Alignment trend
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                      Weekscore <span className="tabular-nums text-[var(--semantic-accent)]">72</span>
                    </p>
                  </div>
                  <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-200/95">
                    Geen drift-signaal
                  </span>
                </div>
                <div className="mt-4 flex h-20 items-end gap-1">
                  {ALIGN_WEEKS.map((h, i) => (
                    <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full max-w-[32px] rounded-t-md bg-gradient-to-t from-[rgba(var(--mode-rgb),0.15)] to-[var(--semantic-accent)]/5"
                        style={{
                          height: `${h}%`,
                          minHeight: "24%",
                          boxShadow: "0 0 12px rgba(var(--mode-rgb),0.08)",
                        }}
                        aria-hidden
                      />
                      <span className="text-[8px] text-[var(--text-muted)]">W{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "review" && (
              <div className="space-y-3 rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-card)]" role="tabpanel">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Review &amp; archief
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Fase: <span className="font-semibold text-[var(--text-primary)]">Execution</span> · week 12 van kwartaal.
                </p>
                <button
                  type="button"
                  className="w-full rounded-xl border border-amber-500/45 bg-amber-500/12 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-100/95"
                >
                  Start weekreview (mock)
                </button>
                <p className="text-[10px] text-[var(--text-muted)]">Archief: vorige kwartalen inklapbaar zoals op /strategy.</p>
              </div>
            )}

            {/* Thesis-uitwerking alleen buiten overview-tab clutter — compact blok */}
            <div className="relative rounded-[20px] border border-[var(--card-border)] bg-[var(--bg-elevated)]/90 p-4 shadow-[var(--shadow-card)]">
              <CornerNode corner="top-left" />
              <CornerNode corner="bottom-right" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Thesis — waarom
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{WHY}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md border border-[var(--card-border)] bg-[var(--bg-card)] px-2 py-1 text-[11px] text-[var(--text-primary)]">
                  Deadline 47d
                </span>
                <span className="rounded-md border border-[var(--card-border)] bg-[var(--bg-card)] px-2 py-1 text-[11px] text-[var(--text-primary)]">
                  Target +12% leer
                </span>
              </div>
            </div>

            <div className="rounded-[20px] border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(5,18,32,0.5)] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Strategic pressure
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div
                  className="relative h-20 w-8 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(4,10,18,0.65)]"
                  style={{ boxShadow: "inset 0 0 10px rgba(0,0,0,0.35)" }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-[var(--accent-focus)] to-emerald-400/85"
                    style={{ height: "55%" }}
                    aria-hidden
                  />
                </div>
                <p className="text-xs font-semibold text-[var(--accent-focus)]">Normaal</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-[rgba(var(--mode-rgb),0.1)] pt-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="rounded-xl border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.28)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-focus)]"
              >
                Kwartaal contract
              </button>
              <Link
                href="/strategy"
                className="text-center text-[10px] font-medium text-[var(--semantic-accent)] underline-offset-2 hover:underline sm:text-right"
              >
                Live Strategy →
              </Link>
            </div>
          </div>

          {/* Vaste analyse-kolom op xl */}
          <aside className="shrink-0 rounded-2xl border border-[rgba(var(--mode-rgb),0.18)] bg-gradient-to-b from-[rgba(8,26,42,0.75)] to-[rgba(4,10,18,0.92)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] xl:sticky xl:top-4 xl:w-[300px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Health scan</p>
            <p className="mt-1 text-[10px] leading-snug text-[var(--text-secondary)]">
              Budget vs growth — altijd in beeld tijdens tab-wissel.
            </p>
            <div className="mt-4 flex justify-center">
              <StrategyAnalysisSplitRing budgetHealth={64} growthHealth={78} budgetWarn={false} growthWarn={false} />
            </div>
            <p className="mt-4 text-center text-[9px] leading-relaxed text-[var(--text-muted)]">
              Waarschuwingen: warme boog = budget strak, cyan = growth achter.
            </p>
          </aside>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}
