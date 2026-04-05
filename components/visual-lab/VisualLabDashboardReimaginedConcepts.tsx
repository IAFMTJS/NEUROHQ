"use client";

import { CommanderStatRing } from "@/components/commander/CommanderStatRing";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { getDashboardMascotSrc } from "@/lib/mascots";
import { SegmentedBar } from "@/components/visual-lab/VisualLabBars";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";

/** Mock brain telemetry — aligned with production ring semantics (0–100%). */
const MOCK_E = 68;
const MOCK_F = 54;
const MOCK_L = 43;

function LabMascotBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
      <div className="absolute -left-[20%] top-0 h-[85%] w-[70%] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(var(--semantic-accent),0.2),transparent_68%)] blur-2xl" />
      <div className="absolute -right-[15%] bottom-0 h-[75%] w-[65%] rounded-full bg-[radial-gradient(circle_at_60%_70%,rgba(99,102,241,0.14),transparent_65%)] blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[rgba(4,12,22,0.85)] to-transparent" />
    </div>
  );
}

function LabMascotImg({ className = "" }: { className?: string }) {
  return (
    <img
      src={getDashboardMascotSrc()}
      alt=""
      className={`mascot-img relative z-[1] mx-auto w-full max-w-[min(300px,88vw)] drop-shadow-[0_22px_56px_rgba(0,0,0,0.5)] ${className}`.trim()}
      aria-hidden
    />
  );
}

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

/** Brede horizon: mascotte als anker, telemetry-balk, bento met HUD-hoeken. */
function DashboardReimagineHorizon() {
  return (
    <section
      className="relative mb-12 scroll-mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.18)] p-3 md:p-4"
      aria-labelledby="vl-dash-horizon-heading"
    >
      <ConceptIntro
        id="vl-dash-horizon-heading"
        tag="Concept A"
        title="Horizon · telemetry + bento"
        subtitle="Zelfde vocabulaire als nu (glass, mode-glow, commander-rings) maar met een brede held en een onderbalk die E/F/L in één oogopslag samenvat. Geschikt als je het dashboard rustiger en ‘filmischer’ wilt."
      />
      <VisualLabCommandDeck contentClassName="min-h-0">
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,20,34,0.4)]">
          <LabMascotBackdrop />
          <div className="relative z-[1] px-4 pb-2 pt-6 md:px-8 md:pt-8">
            <header className="mb-2 text-center md:text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">HQ overview</p>
              <h4 className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)] md:text-xl [text-shadow:0_0_18px_rgba(var(--mode-rgb),0.2)]">
                Dashboard
              </h4>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">System overview — reimagined layout</p>
            </header>
            <div className="flex justify-center py-2 md:py-4">
              <LabMascotImg />
            </div>
            <div className="mx-auto max-w-3xl rounded-xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(4,10,18,0.55)] p-3 backdrop-blur-md md:p-4">
              <SegmentedBar
                label="Commander strip (compact)"
                caption={`${MOCK_E}% · ${MOCK_F}% · ${MOCK_L}%`}
                fills={[MOCK_E / 100, MOCK_F / 100, MOCK_L / 100]}
                segmentLabels={["Energy", "Focus", "Load"]}
              />
            </div>
            <div className="mx-auto mt-4 flex flex-wrap items-end justify-center gap-6 pb-4 md:gap-10">
              <CommanderStatRing variant="energy" value={MOCK_E} size={96} />
              <CommanderStatRing variant="focus" value={MOCK_F} size={96} />
              <CommanderStatRing variant="load" value={MOCK_L} size={96} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-12 md:gap-4">
          <div className="relative glass-card !rounded-2xl !p-4 !shadow-none md:col-span-7 md:!p-5">
            <CornerNode corner="top-left" />
            <CornerNode corner="top-right" />
            <CornerNode corner="bottom-left" />
            <CornerNode corner="bottom-right" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]/90">Wat nu</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Hoofdtaak: deep-work blok plannen</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
              Één duidelijke prioriteit bovenaan; secundaire hints in de rechterkolom. Zelfde glass-card taal als de rest van de site.
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.25)] py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-focus)] shadow-[0_0_20px_rgba(var(--mode-rgb),0.12)]"
            >
              Open missies (mock)
            </button>
          </div>
          <div className="flex flex-col gap-3 md:col-span-5">
            <div className="glass-card !rounded-2xl !p-4 !shadow-none">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Vandaag</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--text-primary)]">5</p>
              <p className="text-[11px] text-[var(--text-secondary)]">openstaande acties · mock</p>
            </div>
            <div className="glass-card !rounded-2xl !p-4 !shadow-none">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-300/85">Daily quote</p>
              <p className="mt-2 text-xs italic leading-snug text-[var(--text-primary)]">
                &ldquo;Kleine stap nu, grote curve later.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}

/** Twee kolommen: mascotte + stats vast, content stroom rechts. */
function DashboardReimagineFlank() {
  return (
    <section
      className="relative mb-12 scroll-mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.18)] p-3 md:p-4"
      aria-labelledby="vl-dash-flank-heading"
    >
      <ConceptIntro
        id="vl-dash-flank-heading"
        tag="Concept B"
        title="Flank · command-kolom"
        subtitle="Mascotte en rings blijven het emotionele anker in een vaste kolom; alles wat ‘werk’ is schuift naar rechts. Ideaal op desktop als je meer scanbare kaarten wilt zonder de held te verliezen."
      />
      <VisualLabCommandDeck
        accentFlareClassName="bg-[radial-gradient(ellipse_at_0%_40%,rgba(var(--mode-rgb),0.12),transparent_55%)]"
        contentClassName="min-h-0"
      >
        <div className="grid gap-5 md:grid-cols-[minmax(260px,300px)_1fr] md:items-start">
          <div className="sticky top-2 space-y-4 rounded-2xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(5,16,28,0.65)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md md:top-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Operator</p>
              <p className="mt-1 text-base font-bold text-[var(--text-primary)]">Command deck</p>
            </div>
            <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.45)] px-2 py-4">
              <LabMascotImg className="max-w-[min(240px,70vw)]" />
            </div>
            <div className="flex flex-col items-center gap-3">
              <CommanderStatRing variant="energy" value={MOCK_E} size={88} />
              <CommanderStatRing variant="focus" value={MOCK_F} size={88} />
              <CommanderStatRing variant="load" value={MOCK_L} size={88} />
            </div>
            <button
              type="button"
              className="commander-cta-glass w-full rounded-full py-3 text-[11px] font-medium tracking-[0.1em] text-[var(--text-main)]"
            >
              Naar taken (mock)
            </button>
          </div>

          <div className="space-y-3 md:min-h-[28rem] md:overflow-y-auto md:pr-1">
            {[
              {
                kicker: "Brain status",
                title: "Check-in vandaag",
                body: "Energie en focus zijn je basis; load bewaakt druk. Zelfde flow als op het echte dashboard, andere raster.",
              },
              {
                kicker: "Commander status",
                title: "DCIC · Focus mode",
                body: "Moduslint en uitleg in één kaart — hier bewust horizontaal en rustig voor leesbaarheid.",
              },
              {
                kicker: "Momentum",
                title: "Score 62 · stabiel",
                body: "Compacte kaart onder de vouw-simulatie; in productie koppel je hier je echte momentum-widget.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="glass-card !rounded-2xl !border-[rgba(var(--mode-rgb),0.12)] !p-4 !shadow-none md:!p-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{c.kicker}</p>
                <p className="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">{c.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}

/** Boog-frame rond mascotte, lint met modus, brede missie-strip. */
function DashboardReimagineArc() {
  return (
    <section
      className="relative mb-4 scroll-mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.18)] p-3 md:p-4"
      aria-labelledby="vl-dash-arc-heading"
    >
      <ConceptIntro
        id="vl-dash-arc-heading"
        tag="Concept C"
        title="Arc opus · modus-lint"
        subtitle="Mascotte in een zacht verlichte boog — ceremonieel, maar nog steeds NEUROHQ (donker glas, accent-glow). Onderaan een brede ‘missie runway’ als primaire CTA-zone."
      />
      <VisualLabCommandDeck
        accentFlareClassName="bg-[radial-gradient(ellipse_at_50%_0%,rgba(168,85,247,0.1),transparent_50%)]"
        contentClassName="min-h-0"
      >
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.15)] bg-gradient-to-b from-[rgba(12,28,48,0.55)] to-[rgba(4,10,18,0.92)] px-4 pb-6 pt-8 md:px-10 md:pb-8 md:pt-10">
          <div
            className="pointer-events-none absolute inset-x-[12%] top-0 h-[62%] rounded-b-[42%] border-x border-t border-[rgba(var(--mode-rgb),0.22)] bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--mode-rgb),0.15),transparent_58%)] shadow-[0_0_60px_rgba(var(--mode-rgb),0.08)]"
            aria-hidden
          />
          <div className="relative z-[1] mx-auto max-w-lg text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">NeuroHQ</p>
            <h4 className="mt-2 text-xl font-bold tracking-tight text-[var(--text-primary)] md:text-2xl [text-shadow:0_0_20px_rgba(var(--mode-rgb),0.18)]">
              Welkom terug, commandant
            </h4>
            <div className="mt-6 flex justify-center">
              <div className="relative rounded-t-[48%] border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(3,10,20,0.5)] px-6 pb-1 pt-10 shadow-[inset_0_0_40px_rgba(var(--mode-rgb),0.06)] backdrop-blur-sm">
                <LabMascotImg className="max-w-[min(280px,82vw)]" />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {[
                { label: "Mode", value: "Focus" },
                { label: "Level", value: "12" },
                { label: "Streak", value: "5 d" },
              ].map((pill) => (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(6,18,30,0.65)] px-3 py-1.5 text-[11px] text-[var(--text-primary)] shadow-[0_0_16px_rgba(var(--mode-rgb),0.08)] backdrop-blur-md"
                >
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">{pill.label}</span>
                  <span className="font-semibold tabular-nums text-[var(--accent-focus)]">{pill.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Energy", pct: MOCK_E, hint: "Ruimte voor vandaag" },
            { label: "Focus", pct: MOCK_F, hint: "Deep-work mogelijk" },
            { label: "Load", pct: MOCK_L, hint: "Druk binnen band" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,18,30,0.5)] p-3 text-center backdrop-blur-sm"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{m.label}</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-[var(--text-primary)]">{m.pct}%</p>
              <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{m.hint}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-4 overflow-hidden rounded-2xl border border-[rgba(var(--semantic-accent),0.28)] bg-[rgba(var(--mode-rgb-deep),0.35)] p-4 md:p-5">
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(var(--semantic-accent),0.08)_50%,transparent_60%)]"
            aria-hidden
          />
          <div className="relative z-[1] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]/90">Actieve missie</p>
              <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">Vandaag: protocol-week 3 afronden</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Runway-stijl: één brede kaart als anker — mock data.</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-xl border border-[rgba(var(--mode-rgb),0.4)] bg-[rgba(8,32,52,0.9)] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent-focus)] shadow-[0_0_24px_rgba(var(--mode-rgb),0.2)]"
            >
              Hervatten
            </button>
          </div>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}

export function VisualLabDashboardReimaginedConcepts() {
  return (
    <div className="visual-lab-dashboard-reimagined space-y-0">
      <div className="relative mb-6 border-b border-[rgba(var(--mode-rgb),0.1)] pb-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Dashboard — drie reimaginings
        </h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[var(--text-secondary)]">
          Gebaseerd op de huidige site: <span className="text-[var(--text-primary)]">glass surfaces</span>,{" "}
          <span className="text-[var(--text-primary)]">mode-RGB glow</span>,{" "}
          <span className="text-[var(--text-primary)]">commander-stat rings</span> en de echte dashboard-mascotte (
          <code className="rounded bg-black/30 px-1 text-[10px]">getDashboardMascotSrc</code>). Alleen layout en hiërarchie
          verkennen — geen nieuwe productielogica.
        </p>
      </div>
      <DashboardReimagineHorizon />
      <DashboardReimagineFlank />
      <DashboardReimagineArc />
    </div>
  );
}
