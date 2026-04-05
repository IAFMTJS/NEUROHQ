"use client";

import { useState } from "react";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { STRATEGY_TAB_ITEMS } from "@/components/strategy/StrategyTabsShell";
import { StrategyAnalysisSplitRing } from "@/components/strategy/StrategyAnalysisSplitRing";
import { SegmentedBar } from "@/components/visual-lab/VisualLabBars";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";
import { tasksDeckTabClass } from "@/components/missions/tasksDeckTabClass";

type StrategyTabId = (typeof STRATEGY_TAB_ITEMS)[number]["id"];

function ConceptIntro({
  id,
  title,
  subtitle,
  tag,
}: {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.12)] pb-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">{tag}</p>
        <h3 id={id} className="mt-1 text-sm font-bold tracking-tight text-[var(--text-primary)] md:text-base">
          {title}
        </h3>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">{subtitle}</p>
      </div>
      <span className="shrink-0 rounded-full border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(6,18,30,0.45)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        Mock · geen live data
      </span>
    </div>
  );
}

const MOCK_THESIS =
  "Buffer opbouwen en execution discipline verdiepen — het kwartaal is de unit van waarheid.";
const MOCK_WHY =
  "Minder impuls-spend, meer herhaalbare ritmes. De engine moet kunnen vertragen zonder momentum te verliezen.";
const MOCK_METRIC = "Spaardoel Q · +12% leergroei";

/** Tab-rail + thesis-banner + split-ring — nabij /strategy hub-navigatie. */
function StrategyReimagineCockpit() {
  const [tab, setTab] = useState<StrategyTabId>("overview");

  return (
    <section
      className="relative mb-12 scroll-mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.18)] p-3 md:p-4"
      aria-labelledby="vl-strat-cockpit-heading"
    >
      <ConceptIntro
        id="vl-strat-cockpit-heading"
        tag="Concept A"
        title="Cockpit · tab-rail + split-ring"
        subtitle="Zelfde tab-labels als productie (Overview, Focus, Alignment, Review), maar als visuele cockpit: thesis als brede kaart, Strategy Analyse-splitring als middelpunt, paneel wisselt per tab — puur layout-exploratie."
      />
      <VisualLabCommandDeck contentClassName="min-h-0">
        <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(4,12,22,0.5)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
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
        </div>

        <div className="glass-card !rounded-[22px] !border-[rgba(var(--mode-rgb),0.14)] !p-4 !shadow-none sm:!p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Strategic thesis</p>
          <p className="mt-2 text-base font-semibold leading-snug text-[var(--text-primary)] md:text-lg">{MOCK_THESIS}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{MOCK_WHY}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.45)] px-2.5 py-1 text-xs text-[var(--text-primary)]">
              Deadline: nog 47 dagen (mock)
            </span>
            <span className="rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.45)] px-2.5 py-1 text-xs text-[var(--text-primary)]">
              Target: {MOCK_METRIC}
            </span>
          </div>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.2)] bg-gradient-to-br from-[rgba(8,26,42,0.92)] via-[var(--bg-elevated)]/85 to-[rgba(var(--mode-rgb-deep),0.18)] px-4 py-6 md:px-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(var(--mode-rgb),0.14),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-10">
            <StrategyAnalysisSplitRing budgetHealth={64} growthHealth={78} budgetWarn={false} growthWarn={false} />
            <div className="max-w-[220px] text-center text-[10px] leading-relaxed text-[var(--text-secondary)] md:text-left">
              Zelfde component als Strategy → Analyse-kaart. In dit concept vormt hij het visuele anker tussen thesis
              en het actieve tab-paneel.
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.4)] p-4 backdrop-blur-sm">
          {tab === "overview" && (
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Overview-paneel (mock):</span> kwartaal-score,
              drivers Growth / Budget / XP / Executie als compacte rij hieronder.
            </p>
          )}
          {tab === "focus" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Focus &amp; budget (mock)</p>
              <SegmentedBar
                label="Weekly allocation — domeinen"
                caption="Werk · Leer · Recovery"
                fills={[0.45, 0.35, 0.2]}
                segmentLabels={["Werk", "Leer", "Recovery"]}
              />
            </div>
          )}
          {tab === "alignment" && (
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Alignment (mock):</span> gepland vs werkelijk
              verdeling en trendlijn — in productie koppel je hier{" "}
              <code className="rounded bg-black/30 px-1 text-[10px]">StrategyAlignmentGraph</code>.
            </p>
          )}
          {tab === "review" && (
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Review &amp; archief (mock):</span> fase-indicator,
              weekly review CTA en archief —zelfde inhoud als nu, andere visuele hiërarchie mogelijk.
            </p>
          )}
          {tab === "overview" ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { k: "Growth", v: "78%", ok: true },
                { k: "Budget", v: "64%", ok: true },
                { k: "XP", v: "52%", ok: false },
                { k: "Executie", v: "71%", ok: true },
              ].map((row) => (
                <div
                  key={row.k}
                  className="rounded-lg border border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(4,12,22,0.55)] px-2 py-2 text-center"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">{row.k}</p>
                  <p className={`mt-1 text-sm font-bold tabular-nums ${row.ok ? "text-emerald-300/95" : "text-amber-200/95"}`}>
                    {row.v}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}

/** Verticale tijdlijn: contract → thesis → alignment → review. */
function StrategyReimagineTimeline() {
  const steps = [
    {
      key: "contract",
      title: "Kwartaal contract",
      body: "Spaardoel, leergroei % en XP-doel vastleggen — ontgrendelt de rest van de hub.",
    },
    {
      key: "thesis",
      title: "Strategic thesis",
      body: MOCK_THESIS,
    },
    {
      key: "align",
      title: "Alignment & momentum",
      body: "Wekelijkse verdeling vs werkelijkheid; drift signalen blijven dicht bij de curve.",
    },
    {
      key: "review",
      title: "Review & archief",
      body: "Weekly review houdt de strategie actief; archief geeft context over eerdere kwartalen.",
    },
  ] as const;

  return (
    <section
      className="relative mb-12 scroll-mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.18)] p-3 md:p-4"
      aria-labelledby="vl-strat-timeline-heading"
    >
      <ConceptIntro
        id="vl-strat-timeline-heading"
        tag="Concept B"
        title="Timeline · narratief spoor"
        subtitle="Alternatief voor diepe <details>-stapels: één verticale lijn die dezelfde inhoudsvolgorde (contract → thesis → tools) als een verhaal leesbaar maakt. Geschikt voor onboarding en mobile scroll."
      />
      <VisualLabCommandDeck
        accentFlareClassName="bg-[radial-gradient(ellipse_at_0%_50%,rgba(var(--semantic-accent),0.08),transparent_50%)]"
        contentClassName="min-h-0"
      >
        <div className="relative pl-8 md:pl-10">
          <div
            className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-[rgba(var(--mode-rgb),0.45)] via-[rgba(var(--mode-rgb),0.2)] to-transparent md:left-[19px]"
            aria-hidden
          />
          <ul className="space-y-6">
            {steps.map((s, i) => (
              <li key={s.key} className="relative">
                <span
                  className="absolute -left-[26px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-[rgba(var(--mode-rgb),0.5)] bg-[rgba(4,12,22,0.95)] shadow-[0_0_12px_rgba(var(--mode-rgb),0.35)] md:-left-[30px]"
                  aria-hidden
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--semantic-accent)]" />
                </span>
                <div className="glass-card !rounded-2xl !p-4 !shadow-none md:!p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]/90">
                    Stap {i + 1} · {s.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{s.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          <strong className="font-semibold">Review due (mock)</strong>
          <p className="mt-1 text-xs text-amber-200/85">
            Banner kan blijven zoals nu — hier bewust in het timeline-blok geplaatst om interruptie vs. flow te testen.
          </p>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}

/** Twee kolommen: compacte thesis + druk, brede ‘analysebord’-zone. */
function StrategyReimagineBoard() {
  return (
    <section
      className="relative mb-4 scroll-mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.18)] p-3 md:p-4"
      aria-labelledby="vl-strat-board-heading"
    >
      <ConceptIntro
        id="vl-strat-board-heading"
        tag="Concept C"
        title="Analysebord · split view"
        subtitle="Links een smalle ‘command column’ met thesis en strategic pressure; rechts een groot canvas voor alignment en domein-momentum — denk aan een strategist workstation binnen dezelfde glass-tokens."
      />
      <VisualLabCommandDeck
        accentFlareClassName="bg-[radial-gradient(ellipse_at_100%_30%,rgba(52,211,153,0.06),transparent_50%)]"
        contentClassName="min-h-0"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,320px)_1fr] lg:items-start">
          <div className="space-y-4">
            <div className="relative glass-card !rounded-2xl !p-4 !shadow-none">
              <CornerNode corner="top-left" />
              <CornerNode corner="bottom-right" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Thesis</p>
              <p className="mt-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">{MOCK_THESIS}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{MOCK_WHY}</p>
            </div>
            <div className="rounded-2xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(5,18,32,0.55)] p-4 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Strategic pressure
              </p>
              <div className="mt-3 flex items-end gap-3">
                <div
                  className="relative h-28 w-11 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(4,10,18,0.65)]"
                  style={{ boxShadow: "inset 0 0 14px rgba(0,0,0,0.35)" }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-[var(--accent-focus)] to-emerald-400/90"
                    style={{ height: "58%" }}
                    aria-hidden
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--accent-focus)]">Normaal</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Druk binnen gezonde band (mock).</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-xl border border-[rgba(var(--mode-rgb),0.3)] bg-[rgba(var(--mode-rgb-deep),0.3)] py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-focus)]"
            >
              Open contract (mock)
            </button>
          </div>

          <div className="min-h-[280px] space-y-4 rounded-2xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(4,12,22,0.45)] p-4 backdrop-blur-sm md:min-h-[320px] md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Alignment canvas (mock)
              </p>
              <span className="rounded-full border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.6)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                Score 72
              </span>
            </div>
            <div className="flex h-36 items-end justify-between gap-2 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(3,8,16,0.5)] px-3 pb-2 pt-4">
              {[42, 68, 55, 80, 50, 72, 65].map((h, idx) => (
                <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-[rgba(var(--mode-rgb),0.15)] to-[var(--semantic-accent)]/50 shadow-[0_0_12px_rgba(var(--mode-rgb),0.15)]"
                    style={{ height: `${h}%`, minHeight: "28%" }}
                    aria-hidden
                  />
                  <span className="text-[8px] font-medium text-[var(--text-muted)]">W{idx + 1}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
              Placeholder-balken voor weektrend; in productie vervang je dit door{" "}
              <code className="rounded bg-black/30 px-1 text-[10px]">StrategyAlignmentGraph</code> + domein-momentum.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Werk", "Leer", "Gezondheid", "Relaties"].map((d) => (
                <span
                  key={d}
                  className="rounded-lg border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(6,20,34,0.55)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-primary)]"
                >
                  {d} · +{d === "Werk" ? "12" : d === "Leer" ? "8" : "5"}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}

export function VisualLabStrategyReimaginedConcepts() {
  return (
    <div className="visual-lab-strategy-reimagined space-y-0">
      <div className="relative mb-6 border-b border-[rgba(var(--mode-rgb),0.1)] pb-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Strategy — drie reimaginings
        </h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[var(--text-secondary)]">
          Geïnspireerd op de huidige <span className="text-[var(--text-primary)]">/strategy</span>-hub: thesis hero,
          kwartaal/engine-blokken, allocatie, alignment en review — zelfde bouwstenen (
          <code className="rounded bg-black/30 px-1 text-[10px]">glass-card</code>,{" "}
          <code className="rounded bg-black/30 px-1 text-[10px]">StrategyAnalysisSplitRing</code>, tab-labels uit{" "}
          <code className="rounded bg-black/30 px-1 text-[10px]">StrategyTabsShell</code>
          ), andere lay-out en leesritme. Alleen mock data.
        </p>
      </div>
      <StrategyReimagineCockpit />
      <StrategyReimagineTimeline />
      <StrategyReimagineBoard />
    </div>
  );
}
