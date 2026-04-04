"use client";

import { getDashboardMascotSrc } from "@/lib/mascots";
import { CommanderMascotPedestal, type CommanderMascotPedestalStats } from "./CommanderMascotPedestal";
import { CommanderStatRing } from "./CommanderStatRing";
import { ClientCTALink } from "./ClientCTALink";
import { useHQStore } from "@/lib/hq-store";
import { scale1To10ToPct } from "@/lib/dashboard-utils";
import { trackEvent } from "@/app/actions/analytics-events";

type Props = {
  energyPct: number;
  focusPct: number;
  loadPct: number;
  missionHref: string;
  missionLabel: string;
  /** For export CSV (default: today). */
  exportDate?: string | null;
  /** When true, show streak-at-risk status (mascot variant). */
  streakAtRisk?: boolean;
  /** Daily quote shown under the rings and above CTA. */
  dailyQuoteText?: string | null;
  dailyQuoteAuthor?: string | null;
  /** When true, skip the inner "Dashboard / System Overview" title (bridge layout supplies chrome elsewhere). */
  hideBuiltInTitle?: boolean;
  /** Dashboard bridge: tekst/links blijven links; mascot + stat-rings gecentreerd; icon-rail overlay rechts. */
  bridgeLayout?: boolean;
  /** Platform + segment-ring (resources + brain; brain wordt gemerged met store-check-in). */
  pedestalStats?: CommanderMascotPedestalStats | null;
  /**
   * Dashboard: bij openstaande missies vandaag toont de CTA een toast i.p.v. alleen te navigeren.
   * `null`/`undefined` = gewone link naar `missionHref`.
   */
  missionCtaAction?: (() => void) | null;
};

export function CommanderHomeHero({
  energyPct,
  focusPct,
  loadPct,
  missionHref,
  missionLabel,
  exportDate,
  streakAtRisk,
  dailyQuoteText,
  dailyQuoteAuthor,
  hideBuiltInTitle = false,
  bridgeLayout = false,
  pedestalStats = null,
  missionCtaAction = null,
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

  const mascotStack = (
    <div className="mascot-hero-mascot-stack relative mx-auto flex w-full justify-center">
      <img
        src={getDashboardMascotSrc()}
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

      <section className={`stats${bridgeLayout ? " commander-bridge-stats" : ""}`}>
        <CommanderStatRing value={effectiveEnergyPct} variant="energy" size={bridgeLayout ? 120 : 102} />
        <CommanderStatRing value={effectiveFocusPct} variant="focus" size={bridgeLayout ? 120 : 102} />
        <CommanderStatRing value={effectiveLoadPct} variant="load" size={bridgeLayout ? 120 : 102} />
      </section>
      {dailyQuoteText && (
        <div className="glass-card glass-preserve-decoration mx-auto !rounded-xl !p-3 w-full max-w-[520px] text-center">
          <p
            className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "rgba(var(--mode-rgb), 0.78)" }}
          >
            Daily Quote
          </p>
          <p className="text-[12px] italic leading-snug text-[var(--text-primary)]">
            &ldquo;{dailyQuoteText}&rdquo;
          </p>
          {dailyQuoteAuthor && (
            <p className="mt-1 text-[10px]" style={{ color: "rgba(var(--mode-rgb), 0.7)" }}>
              — {dailyQuoteAuthor}
            </p>
          )}
        </div>
      )}

      {missionCtaAction ? (
        <button
          type="button"
          className={`commander-cta-glass inline-flex w-full cursor-pointer items-center justify-center rounded-full px-5 text-[11px] font-medium tracking-[0.08em] text-[var(--text-main)] h-[48px] min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${streakAtRisk ? "cta-streak-pulse" : ""} ${dailyQuoteText ? "mt-3.5" : "mt-2"}`}
          onClick={() => {
            void trackEvent("CTA_clicked", { label: missionLabel, href: missionHref, context: "dashboard_mission_toast" });
            missionCtaAction();
          }}
        >
          {missionLabel}
        </button>
      ) : (
        <ClientCTALink
          href={missionHref}
          label={missionLabel}
          tone="glass"
          className={`commander-cta-glass block w-full no-underline rounded-full h-[48px] min-h-[48px] px-5 text-[11px] tracking-[0.08em] ${dailyQuoteText ? "mt-3.5" : "mt-2"}`}
          streakAtRisk={streakAtRisk}
        >
          {missionLabel}
        </ClientCTALink>
      )}
    </>
  );

  if (bridgeLayout) {
    return <div className="bridge-layout-hero text-left">{inner}</div>;
  }
  return inner;
}
