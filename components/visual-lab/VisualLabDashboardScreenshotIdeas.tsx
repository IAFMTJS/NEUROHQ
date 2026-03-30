"use client";
import type { ReactNode } from "react";
import { CommanderMascotPedestal, CommanderStatRing } from "@/components/commander";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";
import { getMascotSrcForPage } from "@/lib/mascots";
import { VISUAL_LAB_PEDESTAL_MOCK } from "@/components/visual-lab/VisualLabPedestalHalfRingAlternatives";

const chipClass =
  "rounded-xl border border-[rgba(var(--mode-rgb),0.24)] bg-[rgba(6,18,30,0.55)] px-3 py-2 shadow-[0_0_18px_rgba(var(--mode-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md";

function QuoteCard({ quote, author }: { quote: string; author?: string }) {
  return (
    <div className="glass-card glass-preserve-decoration mx-auto w-full max-w-lg rounded-xl !p-3 text-center">
      <p
        className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "rgba(var(--mode-rgb),0.78)" }}
      >
        Daily quote
      </p>
      <p className="text-[12px] italic leading-snug text-[var(--text-primary)]">&ldquo;{quote}&rdquo;</p>
      {author ? (
        <p className="mt-1 text-[10px]" style={{ color: "rgba(var(--mode-rgb),0.7)" }}>
          — {author}
        </p>
      ) : null}
    </div>
  );
}

function StatRingsRow() {
  const mock = VISUAL_LAB_PEDESTAL_MOCK;
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-5">
      <CommanderStatRing value={mock.energyPct} variant="energy" size={104} />
      <CommanderStatRing value={mock.focusPct} variant="focus" size={104} />
      <CommanderStatRing value={mock.loadPct} variant="load" size={104} />
    </div>
  );
}

function MascotStack() {
  return (
    <div className="mascot-hero-mascot-stack relative mx-auto flex w-full justify-center">
      <img src={getMascotSrcForPage("dashboard")} alt="" className="mascot-img" aria-hidden />
    </div>
  );
}

function HudChipsRow({ density }: { density: "curved" | "runway" }) {
  const mock = VISUAL_LAB_PEDESTAL_MOCK;
  const xp = mock.totalXP % 1000;
  const neg = mock.budgetRemainingCents < 0;
  const amt = Math.abs(mock.budgetRemainingCents / 100);
  const wrap =
    density === "curved"
      ? "mx-auto -mt-3 flex max-w-[min(520px,100%)] flex-wrap items-start justify-center gap-2"
      : "mt-2 grid grid-cols-3 gap-2";
  return (
    <div className={wrap}>
      <div className={chipClass}>
        <span className="block text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">XP</span>
        <span className="mt-0.5 block text-[13px] font-bold tabular-nums text-[var(--text-primary)]">
          Lv {mock.displayLevel}
        </span>
        <span className="mt-0.5 block text-[10px] tabular-nums text-[var(--text-secondary)]">{xp}/1000</span>
      </div>
      <div className={chipClass}>
        <span className="block text-[8px] font-semibold uppercase tracking-[0.1em] text-cyan-200/85">Scan</span>
        <span className="mt-0.5 block text-[11px] font-bold text-[var(--text-primary)]">Clear</span>
        <span className="mt-0.5 block text-[10px] text-[var(--text-secondary)]">0 blocks</span>
      </div>
      <div className={`${chipClass} ${density === "runway" ? "text-right" : ""}`.trim()}>
        <span className="block text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Budget</span>
        <span className="mt-0.5 block text-[13px] font-bold tabular-nums text-[var(--text-primary)]">
          {neg ? "−" : ""}€{amt.toFixed(0)}
        </span>
        <span className="mt-0.5 block text-[10px] text-[var(--text-secondary)]">{neg ? "over" : "rest"}</span>
      </div>
    </div>
  );
}

function IconRail({ variant }: { variant: "orbital" | "runway" }) {
  const items: Array<{ label: string; tone: string }> =
    variant === "orbital"
      ? [
          { label: "Scan", tone: "rgba(var(--mode-rgb),0.25)" },
          { label: "XP", tone: "rgba(167,139,250,0.2)" },
          { label: "Pin", tone: "rgba(251,146,60,0.18)" },
          { label: "Mode", tone: "rgba(var(--mode-rgb-deep),0.2)" },
        ]
      : [
          { label: "Focus", tone: "rgba(var(--mode-rgb),0.22)" },
          { label: "Plan", tone: "rgba(var(--mode-rgb-deep),0.18)" },
          { label: "Log", tone: "rgba(251,146,60,0.18)" },
          { label: "Help", tone: "rgba(167,139,250,0.18)" },
        ];
  return (
    <div className="flex flex-col justify-center gap-2.5 py-4 pl-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(var(--mode-rgb),0.26)] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-primary)] shadow-[0_0_22px_rgba(var(--mode-rgb),0.12)]"
          style={{
            background: `radial-gradient(circle at 50% 30%, rgba(255,255,255,0.12), transparent 55%), ${it.tone}`,
          }}
          aria-hidden
        >
          {it.label}
        </div>
      ))}
    </div>
  );
}

function SectionBlurb({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
      <span className="font-semibold text-[var(--text-secondary)]">Design intent:</span> {children}
    </p>
  );
}

/** Idea 1 — “Orbital Command”: real pedestal + chips hugging the arc + clean rail. */
function ScreenshotIdeaOrbitalCommand() {
  const mock = VISUAL_LAB_PEDESTAL_MOCK;
  return (
    <DashboardCommandDeckFrame deckTitle="Dashboard" hideTitleVisually outerClassName="!rounded-2xl">
      <div className="pt-4">
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:gap-4">
          <div className="min-w-0">
            <div className="relative mx-auto max-w-[min(520px,100%)]">
              <CommanderMascotPedestal stats={mock}>
                <MascotStack />
              </CommanderMascotPedestal>
            </div>
            <HudChipsRow density="curved" />
            <StatRingsRow />
          </div>
          <IconRail variant="orbital" />
        </div>

        <div className="mt-4 space-y-4">
          <QuoteCard quote="Where id was, ego shall be." author="Sigmund Freud" />
          <div className="rounded-full border border-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-[rgba(6,18,30,0.75)] py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            Start missie
          </div>
          <SectionBlurb>
            Keep the exact silhouette you have (mascot + pedestal), but make it feel more “locked-in”: chips sit closer to the
            arc, icon rail becomes a consistent orbit UI, and the hero becomes the single visual anchor (less random SVG).
          </SectionBlurb>
        </div>
      </div>
    </DashboardCommandDeckFrame>
  );
}

/** Idea 2 — “Runway Deck”: add a grounded runway panel under the pedestal for readability. */
function ScreenshotIdeaRunwayDeck() {
  const mock = VISUAL_LAB_PEDESTAL_MOCK;
  return (
    <DashboardCommandDeckFrame
      deckTitle="Dashboard"
      hideTitleVisually
      outerClassName="!rounded-2xl"
      accentFlareClassName="bg-[radial-gradient(ellipse_90%_70%_at_50%_10%,rgba(var(--mode-rgb-deep),0.18),transparent_55%)]"
    >
      <div className="pt-4">
        <div className="grid grid-cols-[1fr_auto] gap-2 sm:gap-4">
          <div className="min-w-0">
            <div className="mx-auto max-w-[min(560px,100%)]">
              <div className="relative">
                <div className="relative z-[2] -mb-8 flex justify-center sm:-mb-10">
                  <img
                    src={getMascotSrcForPage("dashboard")}
                    alt=""
                    className="h-[min(9rem,38vw)] max-h-[168px] w-auto object-contain object-bottom"
                    style={{ filter: "drop-shadow(0 16px 34px rgba(0,0,0,0.55))" }}
                    aria-hidden
                  />
                </div>
                <div
                  className="relative z-[1] mx-auto rounded-[28px] border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(6,18,30,0.52)] px-4 pb-4 pt-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_40px_rgba(0,0,0,0.35)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 rounded-[28px]" style={{ background: "var(--hud-light-top)" }} />
                  <div className="mx-auto -mt-12 max-w-[min(520px,100%)]">
                    <CommanderMascotPedestal stats={mock}>
                      <MascotStack />
                    </CommanderMascotPedestal>
                  </div>
                  <HudChipsRow density="runway" />
                </div>
              </div>
            </div>

            <StatRingsRow />
          </div>
          <IconRail variant="runway" />
        </div>

        <div className="mt-4 space-y-4">
          <QuoteCard quote="Small moves on a calm morning beat shiny plans at noon." />
          <div className="rounded-full border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(var(--mode-rgb-deep),0.2)] py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
            Start missie
          </div>
          <SectionBlurb>
            Same hero, but the page reads calmer: the “runway” panel captures chips + copy so the arc can stay purely visual.
            This is the one to use if you want less clutter around the feet and more scanning speed.
          </SectionBlurb>
        </div>
      </div>
    </DashboardCommandDeckFrame>
  );
}

export function VisualLabDashboardScreenshotIdeas() {
  return (
    <section className="relative mb-10 w-full space-y-4" aria-labelledby="vl-dash-ss-heading">
      <div>
        <h2 id="vl-dash-ss-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Dashboard · gebaseerd op huidige scherm
        </h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[var(--text-secondary)]">
          Twee voorstellen die de <span className="font-semibold text-[var(--text-primary)]">zelfde blokken</span> volgen
          als productie: Command-header, mascotte op de halve boog, driedelige statusband, XP/Budget HUD, icon-rail
          rechts, drie stat-rings, quote en primaire CTA — met <span className="font-semibold text-[var(--text-primary)]">nieuwe</span> ring-
          en chip-keuzes.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ScreenshotIdeaOrbitalCommand />
        <ScreenshotIdeaRunwayDeck />
      </div>
    </section>
  );
}
