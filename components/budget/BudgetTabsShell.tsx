"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useHQStore } from "@/lib/hq-store";
import { BudgetLockProvider, useBudgetLock } from "@/components/budget/BudgetLockContext";
import { BudgetLockTabBanner } from "@/components/budget/BudgetLockTabBanner";
import { BudgetLockCountdown } from "@/components/budget/BudgetLockCountdown";
import { formatLockEndShort } from "@/lib/budget-lock-display";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { profileEngineHref } from "@/lib/profile-routes";

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
    ? "mx-2 mb-0 mt-0 shrink-0 rounded-lg border-amber-400/45"
    : stickyToViewport
      ? "sticky top-0 z-[25] mb-3"
      : "relative z-0 mb-3";
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/50 bg-amber-500/[0.18] px-3 py-2.5 text-xs text-amber-50 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-md ${stripLayout}`}
      role="status"
      aria-live="polite"
    >
      <span className="min-w-0">
        <strong className="text-amber-100">No-spend lock</strong>
        {untilShort ? ` · tot ${untilShort}` : ""}
        {lockUntilAt ? (
          <span aria-hidden className="inline">
            {" "}
            ·{" "}
            <BudgetLockCountdown unlockAtIso={lockUntilAt} className="text-amber-100/95" />
          </span>
        ) : null}{" "}
        — overzicht is beperkt; snel loggen uitgeschakeld op Goals.{" "}
        <span className="text-amber-100/90">Optimalisatie-start is gepauzeerd.</span> Gebruik Execute voor noodpad.
      </span>
      <a
        href={lockPanelHref}
        className="shrink-0 rounded-md bg-amber-500/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-50 underline-offset-2 hover:bg-amber-500/35 hover:underline"
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
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = useHQStore((s) => s.gameState?.mode?.current ?? "focus");
  const modeLabel =
    mode === "war" ? "War mode" : mode === "recovery" ? "Recovery mode" : "Focus mode";

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
    `rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
      activeTab === tab
        ? "border border-b-0 border-[var(--card-border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    }`;

  const lockBadge = !historyMode && lockActive && (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/55 bg-amber-500/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-100 shadow-sm"
      title="No-spend lock staat aan"
    >
      <span aria-hidden>🔒</span>
      Lock
    </span>
  );

  const tabTrackFull = (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-[var(--card-border)] pb-2"
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

  const budgetHeaderShell =
    "relative overflow-hidden rounded-[var(--hq-card-radius,18px)] border border-[var(--card-border)] bg-gradient-to-b from-[var(--bg-elevated)]/35 via-[var(--bg-primary)]/40 to-[var(--bg-primary)]/55 shadow-[0_8px_32px_rgba(0,0,0,0.22)]";

  /** Simplified command card: dividers follow mode accent — avoids flat “white” card-border lines. */
  const simplifiedDivider = "border-[rgba(var(--mode-rgb),0.1)]";

  const tabPillClass = (tab: TabId) =>
    activeTab === tab
      ? "rounded-full border border-[var(--card-border)] bg-[var(--bg-elevated)]/80 px-3.5 py-2 text-sm font-semibold text-[var(--text-primary)] sm:px-4"
      : "rounded-full border border-transparent px-3.5 py-2 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--card-border)]/80 hover:bg-[var(--bg-elevated)]/50 hover:text-[var(--text-primary)] sm:px-4";

  function renderTabButtonsPills(className?: string) {
    return (
      <div
        className={className ?? "flex flex-wrap items-center justify-center gap-2"}
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

  return (
    <BudgetLockProvider value={{ lockActive: lockActive && !historyMode, lockUntil, lockUntilAt }}>
      {simplifiedLayout ? (
        <div className="flex min-h-0 w-full max-w-none flex-1 flex-col">
          <SciFiPanel
            variant="command"
            className="hq-card-enter relative flex min-h-0 w-full flex-1 flex-col overflow-hidden dashboard-active-mission"
            bodyClassName="relative z-10 flex min-h-0 flex-1 flex-col gap-0 p-0"
          >
            <CornerNode corner="top-left" />
            <CornerNode corner="top-right" />
            <div
              className={`relative shrink-0 border-b ${simplifiedDivider} bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.22)] via-[var(--bg-elevated)]/12 to-[var(--bg-primary)]/35 px-4 pb-5 pt-4 text-center shadow-[inset_0_-1px_0_rgba(var(--mode-rgb),0.06)]`}
            >
              <Link
                href="/dashboard"
                className="absolute left-4 top-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] underline-offset-2 hover:underline"
              >
                ← HQ
              </Link>
              <span className="absolute right-4 top-3.5 inline-flex items-center rounded-full border border-[rgba(var(--mode-rgb),0.2)] bg-[var(--bg-elevated)]/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] shadow-[0_0_20px_rgba(var(--mode-rgb),0.08)]">
                {modeLabel}
              </span>
              <h2 className="mx-auto mt-1 max-w-lg text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-[2.5rem] md:leading-tight">
                Budget
              </h2>
            </div>
            {/* No wrapper: slot may be toast-only (returns null) — a bordered row looked empty. */}
            {simplifiedTopSlot}
            <BudgetLockStrip historyMode={historyMode} lockPanelHref={lockPanelHref} embedded />
            <div
              className={`shrink-0 border-b ${simplifiedDivider} bg-[rgba(var(--mode-rgb),0.05)] px-2 py-2.5 sm:px-3`}
            >
              {renderTabButtonsPills()}
            </div>
            {headerRight ? (
              <div
                className={`shrink-0 border-b ${simplifiedDivider} bg-[rgba(var(--mode-rgb),0.04)] px-3 py-2.5 sm:px-4`}
              >
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between sm:gap-3">
                  {headerRight}
                </div>
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 [-webkit-overflow-scrolling:touch] sm:px-3">
              {panels}
            </div>
            <p className={`shrink-0 border-t ${simplifiedDivider} px-4 py-2 text-center text-[11px] text-[var(--text-muted)]`}>
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
          </SciFiPanel>
        </div>
      ) : centeredPageHeader ? (
        <div className="space-y-4">
          <section className={budgetHeaderShell} aria-label="Budget navigatie">
            <div className="relative px-4 pb-5 pt-4 md:px-6 md:pb-6 md:pt-5">
              <div className="flex items-start justify-between gap-3">
                {centeredPageHeader.backHref ? (
                  <Link
                    href={centeredPageHeader.backHref}
                    className="shrink-0 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0 rounded-md"
                  >
                    ← HQ
                  </Link>
                ) : (
                  <span className="w-14 shrink-0" aria-hidden />
                )}
                <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--card-border)] bg-[var(--bg-elevated)]/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)]">
                  {modeLabel}
                </span>
              </div>
              <h1 className="mt-5 text-center text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl md:text-[2.5rem] md:leading-tight">
                {centeredPageHeader.title}
              </h1>
              {centeredPageHeader.subtitle != null && (
                <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-[var(--text-muted)]">
                  {typeof centeredPageHeader.subtitle === "string" ? centeredPageHeader.subtitle : centeredPageHeader.subtitle}
                </p>
              )}
              {centeredPageHeader.actions != null && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  {centeredPageHeader.actions}
                </div>
              )}
              <div className="mt-6 pt-1">{renderTabButtonsPills()}</div>
            </div>
          </section>
          {belowTabsSlot != null ? <div className="space-y-4">{belowTabsSlot}</div> : null}
          <BudgetLockStrip historyMode={historyMode} lockPanelHref={lockPanelHref} stickyToViewport={false} />
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
