"use client";

import { getMascotSrcForPage } from "@/lib/mascots";
import { CommanderStatRing } from "./CommanderStatRing";
import { ClientCTALink } from "./ClientCTALink";
import { useHQStore } from "@/lib/hq-store";
import { scale1To10ToPct } from "@/lib/dashboard-utils";

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
  const todayDailyState = useHQStore((s) => s.todayDailyState);
  const effectiveEnergyPct =
    typeof todayDailyState?.energy === "number" ? scale1To10ToPct(todayDailyState.energy as number) : energyPct;
  const effectiveFocusPct =
    typeof todayDailyState?.focus === "number" ? scale1To10ToPct(todayDailyState.focus as number) : focusPct;
  const effectiveLoadPct =
    typeof todayDailyState?.sensory_load === "number"
      ? scale1To10ToPct(todayDailyState.sensory_load as number)
      : loadPct;

  const energyLow = effectiveEnergyPct < 20;
  const focusLow = effectiveFocusPct < 20;
  const statusBadge =
    energyLow ? "Slaap of rust eerst" : focusLow ? "Neem een korte pauze" : streakAtRisk ? "Streak in gevaar" : null;

  const handleOpenBrainStatus = () => {
    window.dispatchEvent(new CustomEvent("neurohq-open-brain-status", { detail: { source: "commander-system-overview" } }));
    void import("sonner")
      .then(({ toast }) => {
        toast.message("Brain Status check-in geopend.");
      })
      .catch(() => {});
  };

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
        <CommanderStatRing value={effectiveEnergyPct} variant="energy" />
        <CommanderStatRing value={effectiveFocusPct} variant="focus" />
        <CommanderStatRing value={effectiveLoadPct} variant="load" />
      </section>
      {dailyQuoteText && (
        <div
          className="mx-auto w-full max-w-[520px] rounded-xl px-3 py-2.5 text-center"
          style={{
            border: "1px solid rgba(var(--mode-rgb, 0, 212, 255), 0.35)",
            background:
              "linear-gradient(180deg, rgba(var(--mode-rgb-deep, 0, 136, 255), 0.55), rgba(var(--mode-rgb, 0, 212, 255), 0.16))",
            boxShadow: "0 0 14px rgba(var(--mode-rgb, 0, 212, 255), 0.18)",
          }}
        >
          <p
            className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "rgba(var(--mode-rgb, 0, 212, 255), 0.78)" }}
          >
            Daily Quote
          </p>
          <p className="text-[12px] italic leading-snug text-[var(--text-primary)]">
            &ldquo;{dailyQuoteText}&rdquo;
          </p>
          {dailyQuoteAuthor && (
            <p
              className="mt-1 text-[10px]"
              style={{ color: "rgba(var(--mode-rgb, 0, 212, 255), 0.7)" }}
            >
              — {dailyQuoteAuthor}
            </p>
          )}
        </div>
      )}

      <ClientCTALink
        href={missionHref}
        label={missionLabel}
        tone="glass"
        className={`commander-cta-glass block w-full no-underline rounded-full h-[48px] min-h-[48px] px-5 text-[11px] tracking-[0.08em] ${dailyQuoteText ? "mt-3.5" : "mt-2"}`}
        streakAtRisk={streakAtRisk}
      >
        {missionLabel}
      </ClientCTALink>
      {missionSubtext && (
        <p className="mt-1.5 text-xs text-[var(--text-muted)] text-center">
          {missionSubtext}
        </p>
      )}

      <button
        type="button"
        onClick={handleOpenBrainStatus}
        className="block w-full mt-2 py-2 text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors no-underline rounded-lg border border-white/10 hover:bg-white/5"
        style={{ borderColor: "rgba(var(--mode-rgb, 0, 212, 255), 0.28)" }}
      >
        Brain Status
      </button>
    </>
  );
}
