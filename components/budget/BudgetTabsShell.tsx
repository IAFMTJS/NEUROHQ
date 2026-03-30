"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useHQStore } from "@/lib/hq-store";
import { BudgetLockProvider, useBudgetLock } from "@/components/budget/BudgetLockContext";
import { BudgetLockTabBanner } from "@/components/budget/BudgetLockTabBanner";
import { BudgetLockCountdown } from "@/components/budget/BudgetLockCountdown";
import { formatLockEndShort } from "@/lib/budget-lock-display";
import { profileEngineHref } from "@/lib/profile-routes";
import { tasksDeckTabClass } from "@/components/missions/tasksDeckTabClass";

type TabId = "overview" | "execute" | "analysis" | "optimization" | "lock";
type LegacyTabId = TabId | "tactical" | "goals";

export type BudgetCenteredPageHeader = {
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  actions?: ReactNode;
};

type Props = {
  initialTab: LegacyTabId;
  isHistoryView: boolean;
  historyMode: boolean;
  /** Opens Lock tab; hash `#budget-lock-control` / `#budget-lock-emergency` opens the lock flyout (BudgetLockHub). */
  lockPanelHref: string;
  headerRight: ReactNode;
  overview: ReactNode;
  tactical: ReactNode;
  analysis: ReactNode;
  goals: ReactNode;
  optimization: ReactNode;
  lock: ReactNode;
  lockActive: boolean;
  lockUntil: string | null;
  lockUntilAt: string | null;
  /** Simplified content mode: full-height command card, sticky tabs, scrollable body. */
  simplifiedLayout?: boolean;
  /** Renders under title row (e.g. payday urgency toast). */
  simplifiedTopSlot?: ReactNode;
  /** Full layout: centered title + pill tabs in one shell; back, mode badge, actions. */
  centeredPageHeader?: BudgetCenteredPageHeader;
  /** Full layout: content between tab row and tab panels (e.g. mascot, hints). */
  belowTabsSlot?: ReactNode;
  /**
   * Full layout only: missions-style tab rail + optional `belowTabsSlot` after tabs.
   * Default true (budget page is always wrapped in `DashboardCommandDeckFrame`).
   * Simplified layout never uses the old SciFiPanel / CornerNode card.
   */
  commandDeckLayout?: boolean;
};

function normalizeLegacyTab(tab: LegacyTabId): TabId {
  if (tab === "tactical" || tab === "goals") return "execute";
  return tab;
}

function tabFromSearchParam(raw: string | null, historyMode: boolean): TabId {
  if (raw === "execute" || raw === "tactical" || raw === "goals") {
    return historyMode ? "overview" : "execute";
  }
  if (raw === "analysis") return "analysis";
  if (raw === "optimization") return "optimization";
  if (raw === "lock") return historyMode ? "overview" : "lock";
  return "overview";
}

function BudgetLockStrip({
  historyMode,
  lockPanelHref,
  embedded = false,
  /** When false, strip scrolls with the page (no sticky bar under the main header). */
  stickyToViewport = true,
}: {
  historyMode: boolean;
  lockPanelHref: string;
  /** Inside simplified card: no sticky, flush with layout. */
  embedded?: boolean;
  stickyToViewport?: boolean;
}) {
  const { lockActive, lockUntilAt } = useBudgetLock();
  if (historyMode || !lockActive) return null;
  const untilShort = lockUntilAt ? formatLockEndShort(lockUntilAt) : null;
  const stripLayout = embedded
    ? "mx-0 mb-0 mt-0 shrink-0 rounded-lg"
    : stickyToViewport
      ? "sticky top-0 z-[25] mb-3"
      : "relative z-0 mb-3";
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(var(--mode-rgb),0.32)] bg-[rgba(var(--mode-rgb-deep),0.26)] px-3 py-2.5 text-xs text-[var(--text-primary)] shadow-[0_4px_24px_rgba(var(--mode-rgb),0.1)] backdrop-blur-md ${stripLayout}`}
      role="status"
      aria-live="polite"
    >
      <span className="min-w-0">
        <strong className="text-[var(--semantic-accent)]">No-spend lock</strong>
        {untilShort ? ` · tot ${untilShort}` : ""}
        {lockUntilAt ? (
          <span aria-hidden className="inline">
            {" "}
            ·{" "}
            <BudgetLockCountdown
              unlockAtIso={lockUntilAt}
              className="text-[var(--text-secondary)]"
            />
          </span>
        ) : null}{" "}
        — overzicht is beperkt; snel loggen uitgeschakeld op Goals.{" "}
        <span className="text-[var(--text-secondary)]">Optimalisatie-start is gepauzeerd.</span> Gebruik Execute
        voor noodpad.
      </span>
      <a
        href={lockPanelHref}
        className="shrink-0 rounded-md border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb),0.12)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--accent-focus)] underline-offset-2 hover:bg-[rgba(var(--mode-rgb),0.2)] hover:underline"
      >
        Naar lock
      </a>
    </div>
  );
}

export function BudgetTabsShell({
  initialTab,
  isHistoryView: _isHistoryView,
  historyMode,
  lockPanelHref,
  headerRight,
  overview,
  tactical,
  analysis,
  goals,
  optimization,
  lock,
  lockActive,
  lockUntil,
  lockUntilAt,
  simplifiedLayout = false,
  simplifiedTopSlot,
  centeredPageHeader,
  belowTabsSlot,
  commandDeckLayout = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = useHQStore((s) => s.gameState?.mode?.current ?? "focus");
  const modeLabel =
    mode === "war"
      ? "War mode"
      : mode === "recovery"
        ? "Recovery mode"
        : mode === "overdrive"
          ? "Overdrive mode"
          : "Focus mode";

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const raw = searchParams.get("tab");
    if (raw) return tabFromSearchParam(raw, historyMode);
    return normalizeLegacyTab(initialTab);
  });

  useEffect(() => {
    const next = tabFromSearchParam(searchParams.get("tab"), historyMode);
    setActiveTab((prev) => (prev === next ? prev : next));
  }, [historyMode, searchParams]);

  const setTabWithUrl = useCallback(
    (nextTab: TabId) => {
      if (nextTab === "execute" && historyMode) return;
      if (nextTab === "lock" && historyMode) return;
      setActiveTab(nextTab);
      const params = new URLSearchParams(searchParams.toString());
      if (nextTab === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [historyMode, pathname, router, searchParams],
  );

  const tabs: Array<{ id: TabId; label: string; hidden?: boolean }> = [
    { id: "overview", label: "Status" },
    { id: "execute", label: "Execute", hidden: historyMode },
    { id: "analysis", label: "Inzicht" },
    { id: "optimization", label: "Optimalisatie" },
    { id: "lock", label: "Lock", hidden: historyMode },
  ];

  const tabBtnClassFull = (tab: TabId) =>
    `shrink-0 rounded-t-lg px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-2.5 sm:text-xs ${
      activeTab === tab
        ? "border border-b-0 border-[var(--card-border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    }`;

  const lockBadge = !historyMode && lockActive && (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.35)] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[var(--semantic-accent)] shadow-sm sm:gap-1 sm:px-2 sm:text-[9px]"
      title="No-spend lock staat aan"
    >
      <span aria-hidden>🔒</span>
      Lock
    </span>
  );

  const tabTrackFull = (
    <div
      className="flex flex-nowrap items-center gap-1 overflow-x-auto border-b border-[var(--card-border)] pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:gap-1.5"
      role="tablist"
      aria-label="Budget views"
    >
      {tabs.map((tab) =>
        tab.hidden ? null : (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`budget-tab-btn-${tab.id}`}
            aria-selected={activeTab === tab.id}
            className={tabBtnClassFull(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setTabWithUrl(tab.id)}
          >
            {tab.label}
          </button>
        ),
      )}
      {lockBadge}
    </div>
  );

  const panels = (
    <>
      {activeTab === "overview" && (
        <div key="panel-overview" className="space-y-4">
          <BudgetLockTabBanner context="overview" lockPanelHref={lockPanelHref} />
          {overview}
        </div>
      )}
      {activeTab === "execute" && !historyMode && (
        <div key="panel-execute" className="space-y-4">
          <BudgetLockTabBanner context="execute" lockPanelHref={lockPanelHref} />
          {tactical}
          {goals}
        </div>
      )}
      {activeTab === "analysis" && (
        <div key="panel-analysis" className="space-y-4">
          <BudgetLockTabBanner context="analysis" lockPanelHref={lockPanelHref} />
          {analysis}
        </div>
      )}
      {activeTab === "optimization" && (
        <div key="panel-optimization" className="space-y-4">
          <BudgetLockTabBanner context="optimization" lockPanelHref={lockPanelHref} />
          {optimization}
        </div>
      )}
      {activeTab === "lock" && !historyMode && (
        <div key="panel-lock" className="space-y-4">
          {lock}
        </div>
      )}
    </>
  );

  /** Simplified command card: dividers follow mode accent — avoids flat “white” card-border lines. */
  const simplifiedDivider = "border-[rgba(var(--mode-rgb),0.1)]";

  /** Compact page title: caps + mode-colored glow (no large headline card). */
  const budgetTitleGlowClass =
    "text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-primary)] [text-shadow:0_0_12px_rgba(var(--mode-rgb),0.38),0_0_26px_rgba(var(--mode-rgb),0.16)] sm:text-[0.9375rem]";

  const tabPillClass = (tab: TabId) =>
    activeTab === tab
      ? "shrink-0 rounded-full border border-[rgba(var(--mode-rgb),0.28)] bg-[var(--bg-elevated)]/75 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-[var(--text-primary)] sm:px-2 sm:py-1 sm:text-[11px]"
      : "shrink-0 rounded-full border border-transparent px-1.5 py-0.5 text-[10px] font-medium leading-tight text-[var(--text-muted)] transition-colors hover:border-[rgba(var(--mode-rgb),0.15)] hover:bg-[var(--bg-elevated)]/45 hover:text-[var(--text-primary)] sm:px-2 sm:py-1 sm:text-[11px]";

  function renderTabButtonsPills(className?: string) {
    return (
      <div
        className={
          className ??
          "flex flex-nowrap items-center justify-center gap-1 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
        }
        role="tablist"
        aria-label="Budget views"
      >
        {tabs.map((tab) =>
          tab.hidden ? null : (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`budget-tab-btn-${tab.id}`}
              aria-selected={activeTab === tab.id}
              className={tabPillClass(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              onClick={() => setTabWithUrl(tab.id)}
            >
              {tab.label}
            </button>
          ),
        )}
        {lockBadge}
      </div>
    );
  }

  /** Missions `/tasks` command-deck tab rail (segmented pills in bordered track). */
  function renderTabButtonsDeck(outerClassName?: string) {
    return (
      <div
        className={outerClassName ?? "mt-4 shrink-0"}
        role="navigation"
        aria-label="Budget views"
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">View</span>
          {lockBadge ? <div className="flex shrink-0 flex-wrap justify-end gap-1">{lockBadge}</div> : null}
        </div>
        <div
          className="flex flex-wrap gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(4,12,22,0.5)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm"
          role="tablist"
        >
          {tabs.map((tab) =>
            tab.hidden ? null : (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`budget-tab-btn-${tab.id}`}
                aria-selected={activeTab === tab.id}
                className={tasksDeckTabClass(activeTab === tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => setTabWithUrl(tab.id)}
              >
                {tab.label}
              </button>
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <BudgetLockProvider value={{ lockActive: lockActive && !historyMode, lockUntil, lockUntilAt }}>
      {simplifiedLayout ? (
        <div className="flex min-h-0 w-full max-w-none flex-1 flex-col gap-3">
          <div className="flex shrink-0 justify-end px-0.5">
            <span className="inline-flex shrink-0 items-center rounded-full border border-[rgba(var(--mode-rgb),0.18)] bg-[var(--bg-elevated)]/35 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--accent-focus)]">
              {modeLabel}
            </span>
          </div>
          {simplifiedTopSlot}
          <BudgetLockStrip historyMode={historyMode} lockPanelHref={lockPanelHref} embedded />
          {renderTabButtonsDeck("shrink-0")}
          {headerRight ? (
            <div className={`shrink-0 border-b ${simplifiedDivider} bg-[rgba(var(--mode-rgb),0.03)] px-2 py-1.5 sm:px-3`}>
              <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-between">{headerRight}</div>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 py-1 [-webkit-overflow-scrolling:touch] sm:px-1">
            {panels}
          </div>
          <p className={`shrink-0 border-t ${simplifiedDivider} px-2 py-2 text-center text-[11px] text-[var(--text-muted)] sm:px-4`}>
            <Link href="/tasks" className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
              Missions
            </Link>
            {" · "}
            <Link href="/strategy" className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
              Strategy
            </Link>
            {" · "}
            <Link href={profileEngineHref("modes")} className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
              Turn off simplified
            </Link>
          </p>
        </div>
      ) : centeredPageHeader ? (
        <div className="space-y-4">
          <section className="space-y-2" aria-label="Budget navigatie">
            <div className="flex items-center justify-between gap-2 px-3 pt-2 md:px-4">
              {centeredPageHeader.backHref ? (
                <Link
                  href={centeredPageHeader.backHref}
                  className="shrink-0 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 rounded-md"
                >
                  ← HQ
                </Link>
              ) : (
                <span className="w-10 shrink-0" aria-hidden />
              )}
              <span className="inline-flex shrink-0 items-center rounded-full border border-[rgba(var(--mode-rgb),0.18)] bg-[var(--bg-elevated)]/35 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--accent-focus)]">
                {modeLabel}
              </span>
            </div>
            <h1 className={`px-3 text-center md:px-4 ${budgetTitleGlowClass}`}>{centeredPageHeader.title}</h1>
            {centeredPageHeader.subtitle != null && (
              <p className="mx-auto max-w-xl px-3 text-center text-xs leading-relaxed text-[var(--text-muted)] md:px-4">
                {typeof centeredPageHeader.subtitle === "string" ? centeredPageHeader.subtitle : centeredPageHeader.subtitle}
              </p>
            )}
            {centeredPageHeader.actions != null && (
              <div className="flex flex-wrap items-center justify-center gap-2 px-3 md:px-4">
                {centeredPageHeader.actions}
              </div>
            )}
            <div className={`border-b ${simplifiedDivider} px-2 py-1.5 md:px-3`}>{renderTabButtonsPills()}</div>
          </section>
          {belowTabsSlot != null ? <div className="space-y-4">{belowTabsSlot}</div> : null}
          <BudgetLockStrip historyMode={historyMode} lockPanelHref={lockPanelHref} stickyToViewport={false} />
          <div className="min-h-[120px] space-y-4">{panels}</div>
        </div>
      ) : commandDeckLayout ? (
        <div className="space-y-4">
          <BudgetLockStrip historyMode={historyMode} lockPanelHref={lockPanelHref} />
          {renderTabButtonsDeck()}
          {belowTabsSlot != null ? <div className="space-y-4">{belowTabsSlot}</div> : null}
          <div className="min-h-[120px] space-y-4">{panels}</div>
        </div>
      ) : (
        <div className="space-y-4">
          <BudgetLockStrip historyMode={historyMode} lockPanelHref={lockPanelHref} />
          {tabTrackFull}
          <div className="min-h-[120px] space-y-4">{panels}</div>
        </div>
      )}
    </BudgetLockProvider>
  );
}
