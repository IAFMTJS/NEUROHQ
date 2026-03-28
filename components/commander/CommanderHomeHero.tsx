"use client";

import { getMascotSrcForPage } from "@/lib/mascots";
import { CommanderMascotPedestal, type CommanderMascotPedestalStats } from "./CommanderMascotPedestal";
import { CommanderStatusStrip } from "./CommanderStatusStrip";
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
  /** For export CSV (default: today). */
  exportDate?: string | null;
  /** When true, show streak-at-risk status (mascot variant). */
  streakAtRisk?: boolean;
  /** Daily quote shown under the rings and above CTA. */
  dailyQuoteText?: string | null;
  dailyQuoteAuthor?: string | null;
  /** When true, skip the inner "Dashboard / System Overview" title (e.g. when HQHeader is shown above). */
  hideBuiltInTitle?: boolean;
  /** Dashboard bridge: tekst/links blijven links; mascot + stat-rings gecentreerd; icon-rail overlay rechts. */
  bridgeLayout?: boolean;
  /** Platform + segment-ring (resources + brain; brain wordt gemerged met store-check-in). */
  pedestalStats?: CommanderMascotPedestalStats | null;
};

export function CommanderHomeHero({
  energyPct,
  focusPct,
  loadPct,
  missionHref,
  missionLabel,
  singleGoalLabel,
  exportDate,
  streakAtRisk,
  dailyQuoteText,
  dailyQuoteAuthor,
  hideBuiltInTitle = false,
  bridgeLayout = false,
  pedestalStats = null,
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
    window.dispatchEvent(new CustomEvent("neurohq-open-brain-status", { detail: { source: "commander-home-hero" } }));
    void import("sonner")
      .then(({ toast }) => {
        toast.message("Brain Status check-in geopend.");
      })
      .catch(() => {});
  };

  const mascotStack = (
    <div className="mascot-hero-mascot-stack relative mx-auto flex w-full justify-center">
      <img
        src={getMascotSrcForPage("dashboard")}
        alt=""
        className="mascot-img"
        aria-hidden
      />
      {statusBadge && (
        <span className="pointer-events-none absolute bottom-2 left-1/2 z-[1] -translate-x-1/2 rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-medium text-amber-200">
          {statusBadge}
        </span>
      )}
    </div>
  );

  const inner = (
    <>
      {!hideBuiltInTitle && (
        <header className={bridgeLayout ? "text-left" : undefined}>
          <h1>Dashboard</h1>
          <p className="text-soft">System Overview</p>
        </header>
      )}

      <section
        className={`mascot-hero mascot-hero-top relative w-full overflow-visible ${pedestalStats ? "" : "flex flex-col items-center"}`}
        data-commander-orbit={pedestalStats ? "true" : undefined}
        data-energy-low={energyLow || undefined}
        data-focus-low={focusLow || undefined}
        data-streak-at-risk={streakAtRisk || undefined}
      >
        {pedestalStats ? (
          <CommanderMascotPedestal
            stats={{
              ...pedestalStats,
              energyPct: effectiveEnergyPct,
              focusPct: effectiveFocusPct,
              loadPct: effectiveLoadPct,
              energy1to10:
                typeof todayDailyState?.energy === "number" ? (todayDailyState.energy as number) : undefined,
              focus1to10:
                typeof todayDailyState?.focus === "number" ? (todayDailyState.focus as number) : undefined,
              load1to10:
                typeof todayDailyState?.sensory_load === "number"
                  ? (todayDailyState.sensory_load as number)
                  : undefined,
            }}
          >
            {mascotStack}
          </CommanderMascotPedestal>
        ) : (
          mascotStack
        )}
      </section>

      {singleGoalLabel && (
        <p className="text-sm font-medium text-[var(--text-primary)] rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2" aria-label="Wat nu">
          {singleGoalLabel}
        </p>
      )}
      {pedestalStats && bridgeLayout ? (
        <CommanderStatusStrip
          stats={{
            ...pedestalStats,
            energyPct: effectiveEnergyPct,
            focusPct: effectiveFocusPct,
            loadPct: effectiveLoadPct,
          }}
        />
      ) : (
        <section className={`stats${bridgeLayout ? " commander-bridge-stats" : ""}`}>
          <CommanderStatRing value={effectiveEnergyPct} variant="energy" size={bridgeLayout ? 120 : 102} />
          <CommanderStatRing value={effectiveFocusPct} variant="focus" size={bridgeLayout ? 120 : 102} />
          <CommanderStatRing value={effectiveLoadPct} variant="load" size={bridgeLayout ? 120 : 102} />
        </section>
      )}
      {dailyQuoteText && (
        <div
          className={`w-full max-w-[520px] rounded-xl px-3 py-2.5 ${bridgeLayout ? "mx-0 text-left" : "mx-auto text-center"}`}
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

      <button
        type="button"
        onClick={handleOpenBrainStatus}
        className={`mt-2 block w-full rounded-lg border border-white/10 py-2 text-sm text-[var(--text-muted)] transition-colors no-underline hover:bg-white/5 hover:text-[var(--text-secondary)] ${bridgeLayout ? "px-1 text-left" : "text-center"}`}
        style={{ borderColor: "rgba(var(--mode-rgb, 0, 212, 255), 0.28)" }}
      >
        Brain Status
      </button>
    </>
  );

  if (bridgeLayout) {
    return <div className="bridge-layout-hero text-left">{inner}</div>;
  }
  return inner;
}
