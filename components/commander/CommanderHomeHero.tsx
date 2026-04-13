"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { NativeCachedImg } from "@/components/NativeCachedImg";
import { getDashboardMascotSrc } from "@/lib/mascots";
import { CommanderMascotPedestal, type CommanderMascotPedestalStats } from "./CommanderMascotPedestal";
import { CommanderStatRing } from "./CommanderStatRing";
import { ClientCTALink } from "./ClientCTALink";
import {
  BRIDGE_MISSION_BODY_CLASS,
  BRIDGE_MISSION_CARD_CLASS,
  BRIDGE_MISSION_CTA_FOCUS_CLASS,
  BRIDGE_MISSION_EYEBROW_CLASS,
  bridgeMissionEyebrowStyle,
} from "./bridgeMissionCardClasses";
import { useHQStore } from "@/lib/hq-store";
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
  /** Dashboard bridge: small card links (left); mission CTA uses half width on larger screens. */
  mainMissionSlot?: ReactNode;
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
  mainMissionSlot = null,
}: Props) {
  const dcicMode = useHQStore((s) => s.gameState?.mode?.current ?? "focus");
  // Display-only values: this component should render the resolved dashboard percentages as-is.
  // Source-of-truth lives in DashboardClientShell (pending local write -> store -> snapshot fallback).
  const effectiveEnergyPct = energyPct;
  const effectiveFocusPct = focusPct;
  const effectiveLoadPct = loadPct;

  const energyLow = effectiveEnergyPct < 20;
  const focusLow = effectiveFocusPct < 20;
  const statusBadge =
    energyLow ? "Slaap of rust eerst" : focusLow ? "Neem een korte pauze" : streakAtRisk ? "Streak in gevaar" : null;

  const mascotStack = (
    <div className="mascot-hero-mascot-stack relative mx-auto flex w-full justify-center">
      <NativeCachedImg
        src={getDashboardMascotSrc(dcicMode)}
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
        <div className="bridge-hero-daily-quote glass-card glass-preserve-decoration mx-auto w-full max-w-[520px] !rounded-xl border border-[var(--card-border)] !p-3 text-center">
          <p className={`mb-1 ${BRIDGE_MISSION_EYEBROW_CLASS}`} style={bridgeMissionEyebrowStyle}>
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

      <div
        className={`bridge-mission-footer w-full gap-2 ${mainMissionSlot ? "grid grid-cols-2 items-stretch" : "flex flex-col"} ${dailyQuoteText ? "mt-2" : "mt-1.5"}`}
      >
        {mainMissionSlot ? (
          <div className="min-h-0 min-w-0">{mainMissionSlot}</div>
        ) : null}
        <div className={mainMissionSlot ? "min-h-0 min-w-0" : "w-full"}>
          {mainMissionSlot ? (
            missionCtaAction ? (
              <button
                type="button"
                className={`bridge-mission-cta-card ${BRIDGE_MISSION_CARD_CLASS} ${BRIDGE_MISSION_CTA_FOCUS_CLASS} ${streakAtRisk ? "cta-streak-pulse" : ""}`}
                onClick={() => {
                  void trackEvent("CTA_clicked", {
                    label: missionLabel,
                    href: missionHref,
                    context: "dashboard_mission_toast",
                  });
                  missionCtaAction();
                }}
              >
                <p className={BRIDGE_MISSION_EYEBROW_CLASS} style={bridgeMissionEyebrowStyle}>
                  Volgende stap
                </p>
                <p className={BRIDGE_MISSION_BODY_CLASS}>{missionLabel}</p>
              </button>
            ) : (
              <Link
                href={missionHref}
                className={`bridge-mission-cta-card ${BRIDGE_MISSION_CARD_CLASS} ${BRIDGE_MISSION_CTA_FOCUS_CLASS} ${streakAtRisk ? "cta-streak-pulse" : ""}`}
                onClick={() => {
                  void trackEvent("CTA_clicked", { label: missionLabel, href: missionHref });
                }}
              >
                <p className={BRIDGE_MISSION_EYEBROW_CLASS} style={bridgeMissionEyebrowStyle}>
                  Volgende stap
                </p>
                <p className={BRIDGE_MISSION_BODY_CLASS}>{missionLabel}</p>
              </Link>
            )
          ) : missionCtaAction ? (
            <button
              type="button"
              className={`commander-cta-glass inline-flex w-full cursor-pointer items-center justify-center rounded-full px-3 text-[11px] font-medium tracking-[0.08em] text-[var(--text-main)] h-[48px] min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] sm:px-5 ${streakAtRisk ? "cta-streak-pulse" : ""}`}
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
              className="commander-cta-glass block w-full no-underline rounded-full h-[48px] min-h-[48px] px-3 text-[11px] tracking-[0.08em] sm:px-5"
              streakAtRisk={streakAtRisk}
            >
              {missionLabel}
            </ClientCTALink>
          )}
        </div>
      </div>
    </>
  );

  if (bridgeLayout) {
    return <div className="bridge-layout-hero text-left">{inner}</div>;
  }
  return inner;
}
