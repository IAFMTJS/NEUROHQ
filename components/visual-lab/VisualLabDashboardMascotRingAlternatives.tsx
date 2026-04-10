"use client";

import { useState } from "react";
import { CommanderMascotPedestal } from "@/components/commander/CommanderMascotPedestal";
import { CommanderStatRing } from "@/components/commander/CommanderStatRing";
import { EnergyRing } from "@/components/hud-test/EnergyRing";
import { NativeCachedImg } from "@/components/NativeCachedImg";
import { getDashboardMascotSrc } from "@/lib/mascots";
import { StrategyAnalysisSplitRing } from "@/components/strategy/StrategyAnalysisSplitRing";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";

const E = 68;
const F = 54;
const L = 43;
const AVG = Math.round((E + F + L) / 3);

const PEDESTAL = {
  totalXP: 45_200,
  budgetRemainingCents: 42_050,
  currency: "EUR",
  energyPct: E,
  focusPct: F,
  loadPct: L,
  energy1to10: 7,
  focus1to10: 5,
  load1to10: 4,
} as const;

function MascotBlock() {
  return (
    <div className="mascot-hero-mascot-stack relative mx-auto flex w-full justify-center">
      <NativeCachedImg src={getDashboardMascotSrc()} alt="" className="mascot-img" aria-hidden />
    </div>
  );
}

function DeckChromeTop() {
  return (
    <>
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[rgba(var(--mode-rgb),0.12)] pb-1.5 pt-0.5">
        <div className="min-w-0 border-l-2 border-[rgba(var(--semantic-accent),0.55)] pl-2">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Alternatieven</p>
          <h3 className="text-[13px] font-bold leading-tight tracking-tight text-[var(--text-primary)] md:text-sm">
            Mascotte + status
          </h3>
        </div>
        <span className="text-[8px] text-[var(--text-muted)]">Mock</span>
      </div>
      <div className="shrink-0 space-y-0.5">
        <div className="flex justify-between text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          <span>Energy pool</span>
          <span className="tabular-nums normal-case text-[var(--text-secondary)]">62%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(4,10,18,0.6)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.3)] via-[var(--semantic-accent)] to-emerald-400/80"
            style={{ width: "62%" }}
            aria-hidden
          />
        </div>
      </div>
    </>
  );
}

function StatBarsBlock() {
  const rows = [
    { key: "energy", label: "Energy", v: E, bar: "from-cyan-400/90 to-cyan-300/70" },
    { key: "focus", label: "Focus", v: F, bar: "from-violet-500/90 to-violet-300/70" },
    { key: "load", label: "Load", v: L, bar: "from-orange-500/90 to-amber-400/70" },
  ] as const;
  return (
    <div className="space-y-1.5 px-2 pb-2 pt-1">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex justify-between text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
            <span>{r.label}</span>
            <span className="tabular-nums normal-case text-[var(--text-secondary)]">{r.v}%</span>
          </div>
          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,10,18,0.55)]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${r.bar}`}
              style={{ width: `${r.v}%` }}
              aria-hidden
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Drie verticale “glyph” meters — geen cirkel, wel duidelijke zones. */
function TriGlyphMeters() {
  const cols = [
    { v: E, c: "from-cyan-400 to-cyan-600", label: "E" },
    { v: F, c: "from-violet-400 to-violet-600", label: "F" },
    { v: L, c: "from-orange-400 to-orange-600", label: "L" },
  ] as const;
  return (
    <div className="flex items-end justify-center gap-3 px-2 pb-2 pt-2">
      {cols.map((col) => (
        <div key={col.label} className="flex flex-col items-center gap-1">
          <div className="relative h-20 w-2 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.2)] bg-black/40">
            <div
              className={`absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t ${col.c}`}
              style={{ height: `${col.v}%` }}
              aria-hidden
            />
          </div>
          <span className="text-[9px] font-bold text-[var(--text-muted)]">{col.label}</span>
          <span className="text-[8px] tabular-nums text-[var(--text-secondary)]">{col.v}</span>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  {
    id: "arc-rings",
    label: "1 · Boog + ringen",
    hint: "Triple-band onder de voeten + drie CommanderStatRing naast/onder.",
  },
  {
    id: "arc-only",
    label: "2 · Alleen boog",
    hint: "Geen losse ringen: alles leesbaar op de resourceband (+ XP/Budget-kaarten).",
  },
  {
    id: "bars",
    label: "3 · Balken",
    hint: "Geen boog: platte meterbalken als alternatief voor halve ringen.",
  },
  {
    id: "mega-ring",
    label: "4 · Mega-orbit",
    hint: "Één grote EnergyRing als samenvattende “pulse” (mock-gemiddelde).",
  },
  {
    id: "split-dial",
    label: "5 · Split dial",
    hint: "Twee halve ringen (strategy-stijl) i.p.v. triple-band — andere metafoor.",
  },
  {
    id: "glyphs",
    label: "6 · Glyph-kolommen",
    hint: "Drie verticale zone-staven — geen boog, geen ring, andere visuele taal dan balken.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

function HeroArcAndRings() {
  return (
    <div className="relative flex min-h-[11rem] flex-1 flex-col justify-start pt-0.5">
      <div className="visual-lab-dash-hero grid grid-cols-1 gap-1 overflow-visible rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[radial-gradient(ellipse_100%_95%_at_50%_85%,rgba(var(--mode-rgb),0.16),rgba(4,12,22,0.45))] px-1 pb-1 pt-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-2 sm:px-2 sm:pt-1">
        <section
          className="mascot-hero mascot-hero-top relative min-w-0 -translate-y-1 overflow-visible sm:-translate-y-2"
          data-commander-orbit="true"
        >
          <CommanderMascotPedestal stats={{ ...PEDESTAL }}>
            <MascotBlock />
          </CommanderMascotPedestal>
        </section>
        <section
          className="stats visual-lab-dash-rings commander-bridge-stats flex shrink-0 flex-row items-end justify-center gap-3 pb-1 sm:flex-col sm:items-center sm:justify-start sm:gap-2 sm:pb-0 sm:pt-4 sm:pr-1"
          aria-label="Brain status (mock)"
        >
          <CommanderStatRing variant="energy" value={E} size={52} />
          <CommanderStatRing variant="focus" value={F} size={52} />
          <CommanderStatRing variant="load" value={L} size={52} />
        </section>
      </div>
    </div>
  );
}

function HeroArcOnly() {
  return (
    <div className="relative flex min-h-[12rem] flex-1 flex-col justify-start pt-0.5">
      <div className="overflow-visible rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[radial-gradient(ellipse_100%_95%_at_50%_88%,rgba(var(--mode-rgb),0.14),rgba(4,12,22,0.42))] px-1 pb-1 pt-0">
        <section className="mascot-hero mascot-hero-top relative overflow-visible" data-commander-orbit="true">
          <CommanderMascotPedestal stats={{ ...PEDESTAL }}>
            <MascotBlock />
          </CommanderMascotPedestal>
        </section>
      </div>
    </div>
  );
}

function HeroBars() {
  return (
    <div className="visual-lab-dash-alt-noarc relative flex min-h-[9rem] flex-1 flex-col justify-start overflow-visible rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[radial-gradient(ellipse_90%_100%_at_50%_0%,rgba(var(--mode-rgb),0.12),rgba(4,12,22,0.4))] pt-1">
      <section className="relative -translate-y-0.5 overflow-visible" data-commander-orbit="true">
        <CommanderMascotPedestal stats={{ ...PEDESTAL }} showResourceArc={false}>
          <MascotBlock />
        </CommanderMascotPedestal>
      </section>
      <StatBarsBlock />
    </div>
  );
}

function HeroMegaRing() {
  return (
    <div className="visual-lab-dash-alt-noarc relative flex min-h-[10rem] flex-1 flex-col items-center justify-start overflow-visible rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[radial-gradient(circle_at_50%_25%,rgba(var(--semantic-accent),0.08),rgba(4,12,22,0.42))] pt-2">
      <section className="relative w-full overflow-visible" data-commander-orbit="true">
        <CommanderMascotPedestal stats={{ ...PEDESTAL }} showResourceArc={false}>
          <MascotBlock />
        </CommanderMascotPedestal>
      </section>
      <div className="-mt-1 flex flex-col items-center pb-2">
        <EnergyRing
          progress={AVG}
          size={92}
          label="Gem."
          value={`${AVG}%`}
          mode="default"
          softGlow
        />
        <p className="mt-1 max-w-[14rem] px-2 text-center text-[8px] leading-snug text-[var(--text-muted)]">
          Mock: gemiddelde van E/F/L — in productie zou dit een eigen metriek kunnen zijn.
        </p>
      </div>
    </div>
  );
}

function HeroSplitDial() {
  return (
    <div className="visual-lab-dash-alt-noarc grid min-h-[10rem] flex-1 grid-cols-1 gap-1 overflow-visible rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(5,14,24,0.35)] px-1 py-1 sm:grid-cols-[minmax(0,1fr)_5.5rem] sm:items-center sm:gap-2">
      <section className="relative min-w-0 overflow-visible" data-commander-orbit="true">
        <CommanderMascotPedestal stats={{ ...PEDESTAL }} showResourceArc={false}>
          <MascotBlock />
        </CommanderMascotPedestal>
      </section>
      <div className="flex flex-col items-center justify-center gap-1 pb-1 sm:pb-0">
        <div className="w-[5.25rem] shrink-0">
          <StrategyAnalysisSplitRing
            budgetHealth={Math.max(0, 100 - L)}
            growthHealth={E}
            budgetWarn={L >= 70}
            growthWarn={E < 40}
          />
        </div>
        <p className="text-center text-[7px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Reserve · Drive
        </p>
      </div>
    </div>
  );
}

function HeroGlyphs() {
  return (
    <div className="visual-lab-dash-alt-noarc flex min-h-[10rem] flex-1 flex-col overflow-visible rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[radial-gradient(ellipse_80%_90%_at_50%_15%,rgba(var(--mode-rgb),0.1),rgba(4,12,22,0.38))]">
      <section className="relative overflow-visible pt-1" data-commander-orbit="true">
        <CommanderMascotPedestal stats={{ ...PEDESTAL }} showResourceArc={false}>
          <MascotBlock />
        </CommanderMascotPedestal>
      </section>
      <TriGlyphMeters />
    </div>
  );
}

function ActiveHero({ id }: { id: TabId }) {
  switch (id) {
    case "arc-rings":
      return <HeroArcAndRings />;
    case "arc-only":
      return <HeroArcOnly />;
    case "bars":
      return <HeroBars />;
    case "mega-ring":
      return <HeroMegaRing />;
    case "split-dial":
      return <HeroSplitDial />;
    case "glyphs":
      return <HeroGlyphs />;
    default:
      return <HeroArcAndRings />;
  }
}

export function VisualLabDashboardMascotRingAlternatives() {
  const [tab, setTab] = useState<TabId>("arc-rings");

  return (
    <section
      className="relative mb-10 scroll-mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.18)] p-3 md:p-4"
      aria-labelledby="vl-dash-mascot-ring-alts-heading"
    >
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2 border-b border-[rgba(var(--mode-rgb),0.1)] pb-2">
        <h2
          id="vl-dash-mascot-ring-alts-heading"
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
        >
          Zes alternatieven: mascotte + status
        </h2>
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock</span>
      </div>
      <p className="mb-3 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
        Elk tabblad is een andere combinatie van de mascotte met de halve resourceboog, CommanderStatRing, of een
        vervanger (balken, split dial, mega-ring, capsules + kolommen).
      </p>

      <div
        role="tablist"
        aria-label="Mascotte-status concepten"
        className="mb-2 flex flex-wrap gap-1.5"
      >
        {TABS.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`vl-mascot-alt-panel-${t.id}`}
              id={`vl-mascot-alt-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={
                selected
                  ? "rounded-lg border border-[rgba(var(--semantic-accent),0.45)] bg-[rgba(var(--semantic-accent),0.1)] px-2 py-1 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)]"
                  : "rounded-lg border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)] px-2 py-1 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] transition hover:border-[rgba(var(--mode-rgb),0.22)] hover:text-[var(--text-secondary)]"
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <p className="mb-2 text-[10px] leading-snug text-[var(--text-secondary)]">
        {TABS.find((x) => x.id === tab)?.hint}
      </p>

      <VisualLabCommandDeck
        className="!overflow-visible"
        contentClassName="min-h-0 overflow-visible p-2 pb-6 md:p-3 md:pb-7"
      >
        <div
          id={`vl-mascot-alt-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`vl-mascot-alt-tab-${tab}`}
          className="visual-lab-dash-noscroll dashboard-command-bridge relative mx-auto flex h-[min(34rem,calc(88svh-10rem))] w-full max-w-[22rem] flex-col gap-1 md:max-w-[26rem] md:gap-1.5"
        >
          <DeckChromeTop />
          <ActiveHero id={tab} />
          <p className="shrink-0 truncate px-1 text-center text-[9px] italic leading-tight text-[var(--text-secondary)]">
            &ldquo;Zes routes naar dezelfde data — kies wat past bij je scherm en tempo.&rdquo;
          </p>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}
