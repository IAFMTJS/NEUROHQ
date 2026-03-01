import Link from "next/link";
import { getMascotSrcForPage } from "@/lib/mascots";
import { CommanderStatRing } from "./CommanderStatRing";
import { ClientCTALink } from "./ClientCTALink";

type Props = {
  energyPct: number;
  focusPct: number;
  loadPct: number;
  missionHref: string;
  missionLabel: string;
  /** Single measurable goal: "wat moet ik nu doen?" (e.g. first incomplete task + XP). */
  singleGoalLabel?: string | null;
  /** Micro-copy under CTA: gevolg van klikken (minder verrassingen → meer vertrouwen). */
  missionSubtext?: string | null;
  /** For export CSV (default: today). */
  exportDate?: string | null;
  /** When true, show streak-at-risk status (mascot variant). */
  streakAtRisk?: boolean;
  /** Daily quote shown under the rings and above CTA. */
  dailyQuoteText?: string | null;
  dailyQuoteAuthor?: string | null;
  /** Fase 4: 1–3 auto-suggestions (capacity + day + history). */
  autoSuggestions?: { text: string; type: string }[];
};

export function CommanderHomeHero({
  energyPct,
  focusPct,
  loadPct,
  missionHref,
  missionLabel,
  singleGoalLabel,
  missionSubtext,
  exportDate,
  streakAtRisk,
  dailyQuoteText,
  dailyQuoteAuthor,
  autoSuggestions = [],
}: Props) {
  const energyLow = energyPct < 20;
  const focusLow = focusPct < 20;
  const statusBadge =
    energyLow ? "Slaap of rust eerst" : focusLow ? "Neem een korte pauze" : streakAtRisk ? "Streak in gevaar" : null;

  return (
    <>
      <header>
        <h1>Dashboard</h1>
        <p className="text-soft">System Overview</p>
      </header>

      <section
        className="mascot-hero mascot-hero-top relative"
        aria-hidden
        data-energy-low={energyLow || undefined}
        data-focus-low={focusLow || undefined}
        data-streak-at-risk={streakAtRisk || undefined}
      >
        <img
          src={getMascotSrcForPage("dashboard")}
          alt=""
          className="mascot-img"
        />
        {statusBadge && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-medium text-amber-200">
            {statusBadge}
          </span>
        )}
      </section>

      {singleGoalLabel && (
        <p className="text-sm font-medium text-[var(--text-primary)] rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2" aria-label="Wat nu">
          {singleGoalLabel}
        </p>
      )}
      {autoSuggestions.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)] rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-3 py-2" aria-label="Suggesties">
          {autoSuggestions.map((s, i) => (
            <li key={i}>{s.text}</li>
          ))}
        </ul>
      )}

      <section className="stats">
        <CommanderStatRing value={energyPct} variant="energy" />
        <CommanderStatRing value={focusPct} variant="focus" />
        <CommanderStatRing value={loadPct} variant="load" />
      </section>
      {dailyQuoteText && (
        <div className="mx-auto w-full max-w-[520px] rounded-xl border border-cyan-400/35 bg-[linear-gradient(180deg,rgba(11,33,52,0.9),rgba(8,20,33,0.9))] px-3 py-2.5 text-center shadow-[0_0_14px_rgba(0,229,255,0.16)]">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-200/80">
            Daily Quote
          </p>
          <p className="text-[12px] italic leading-snug text-[var(--text-primary)]">
            &ldquo;{dailyQuoteText}&rdquo;
          </p>
          {dailyQuoteAuthor && (
            <p className="mt-1 text-[10px] text-cyan-100/70">
              — {dailyQuoteAuthor}
            </p>
          )}
        </div>
      )}

      <ClientCTALink
        href={missionHref}
        label={missionLabel}
        tone="glass"
        className="commander-cta-glass block w-full no-underline rounded-full h-[48px] min-h-[48px] px-5 text-[11px] tracking-[0.08em]"
        streakAtRisk={streakAtRisk}
      >
        {missionLabel}
      </ClientCTALink>
      {missionSubtext && (
        <p className="mt-1.5 text-xs text-[var(--text-muted)] text-center">
          {missionSubtext}
        </p>
      )}

      <Link
        href="#brain-status-modal"
        className="block w-full mt-2 py-2 text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors no-underline rounded-lg border border-white/10 hover:border-[rgba(0,212,255,0.25)] hover:bg-white/5"
      >
        Brain Status
      </Link>
    </>
  );
}
