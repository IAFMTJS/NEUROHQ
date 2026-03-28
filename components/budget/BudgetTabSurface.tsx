import type { ReactNode } from "react";

export type BudgetCommandTabId = "overview" | "execute" | "analysis" | "optimization" | "lock";

const TAB_COPY: Record<
  BudgetCommandTabId,
  { kicker: string; title: string; subtitle: string; roadmap: string[] }
> = {
  overview: {
    kicker: "Tab · Status",
    title: "Command status",
    subtitle:
      "Waar je nu staat in deze cyclus: waarschuwingen, strategie-tempo, sync, buffergevoel en je hoofdgetal — zonder meteen in de boekhouding te duiken.",
    roadmap: [
      "Undo of tijdvenster-correctie op laatste boekingen",
      "Logging-ritme / streak zodat je ziet wanneer adviezen betrouwbaar zijn",
      "Aparte noodbuffer-runway vs. fun money in het overzicht",
    ],
  },
  execute: {
    kicker: "Tab · Execute",
    title: "Run the cycle",
    subtitle:
      "Looncyclus, uitgaven en bevroren aankopen, quick log, daarna spaardoelen en vaste lasten — één werkbaar spoor voor deze periode.",
    roadmap: [
      "Abonnementen- en factuurkalender (bill shock vóór afschrijving)",
      "Splitsing huishouden (percentage of gedeelde categorie)",
      "Allocatie / enveloppen (koppeling met experimentele plankaarten)",
    ],
  },
  analysis: {
    kicker: "Tab · Inzicht",
    title: "Signals & coach",
    subtitle:
      "Samenvatting, discipline, weekperformance, patronen en grafieken — bedoeld om te begrijpen en één actie te kiezen, niet om spreadsheet-pijn te voelen.",
    roadmap: [
      "Eén kaart: Strategy-focusthema’s vs. jouw top-uitgaven",
      "Sterkere ‘data maturity’-banner (wanneer mag de app strak adviseren)",
      "Consolidatie van experiment vs. standaard intelligence-paden",
    ],
  },
  optimization: {
    kicker: "Tab · Optimization",
    title: "Calibratie & verbetering",
    subtitle:
      "Loon-enquête wanneer nodig, weekreview-ritme en concrete micro-challenges — de brug tussen inzicht en gedrag, inclusief link naar lock.",
    roadmap: [
      "Slimme herinneringen (payday, lock-einde, missing log) met quiet hours",
      "Accountability buddy-signaal (aansluiten op profiel)",
      "Bank-import of CSV-sync wanneer het product dat ondersteunt",
    ],
  },
  lock: {
    kicker: "Tab · Lock",
    title: "Hard brake",
    subtitle:
      "No-spend venster met duidelijke timer, status en noodpad — harde rem zonder je systeem te slopen als er echt iets moet.",
    roadmap: [
      "Optionele ‘zachte lock’ (alleen waarschuwen, niet blokkeren)",
      "Buddy of externe commit-notify bij start/einde lock",
    ],
  },
};

type Props = {
  tabId: BudgetCommandTabId;
  children: ReactNode;
};

/** One cinematic “tab card” per budget view: mission-style header, body, roadmap footer. */
export function BudgetTabSurface({ tabId, children }: Props) {
  const meta = TAB_COPY[tabId];

  return (
    <section
      className="budget-command-tab-surface space-y-5"
      aria-labelledby={`budget-tab-${tabId}-title`}
      data-budget-tab={tabId}
    >
      <div className="relative overflow-hidden rounded-xl border border-[var(--card-border)]/90 bg-gradient-to-br from-[var(--bg-surface)]/95 via-[var(--bg-primary)]/45 to-[var(--bg-surface)]/25 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.14)] sm:px-5 sm:py-4">
        <div
          className="pointer-events-none absolute inset-y-3 left-0 w-px bg-gradient-to-b from-[var(--accent-focus)] via-[var(--semantic-accent)]/60 to-transparent opacity-90"
          aria-hidden
        />
        <p className="pl-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-focus)]/90">
          {meta.kicker}
        </p>
        <h2
          id={`budget-tab-${tabId}-title`}
          className="mt-1.5 pl-3 text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl"
        >
          {meta.title}
        </h2>
        <p className="mt-1 max-w-2xl pl-3 text-sm leading-relaxed text-[var(--text-muted)]">{meta.subtitle}</p>
      </div>

      <div className="space-y-4">{children}</div>

      <div className="rounded-xl border border-dashed border-[var(--card-border)]/80 bg-[var(--bg-primary)]/30 px-4 py-3 sm:px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">
          Roadmap — nog toe te voegen
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1.5 text-xs leading-snug text-[var(--text-muted)] marker:text-[var(--accent-focus)]/75">
          {meta.roadmap.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
