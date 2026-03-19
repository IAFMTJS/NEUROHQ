"use client";

type Props = {
  impulseWindow: string | null;
  topCategories: string[];
};

export function ImpulseTriggerMapCard({ impulseWindow, topCategories }: Props) {
  return (
    <section className="card-simple overflow-hidden p-0 ring-1 ring-rose-400/20 shadow-[0_0_24px_rgba(244,63,94,0.1)]">
      <div className="border-b border-[var(--card-border)] bg-[linear-gradient(90deg,rgba(244,63,94,0.1),rgba(168,85,247,0.04))] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Impulse trigger map</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Wanneer en waar impuls-risico het hoogst is.</p>
      </div>
      <div className="space-y-2 p-4 text-sm">
        <p className="text-[var(--text-primary)]">
          Tijdvenster: <span className="font-semibold">{impulseWindow ?? "nog geen duidelijke piek"}</span>
        </p>
        <p className="text-[var(--text-muted)]">
          Risicocategorieen: {topCategories.length ? topCategories.join(", ") : "onbekend"}
        </p>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-3 py-2 text-xs text-[var(--text-muted)]">
          If-then: “Als ik in dit venster wil kopen, dan wacht ik 10 minuten en check ik eerst mijn cap.”
        </div>
      </div>
    </section>
  );
}
