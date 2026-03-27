"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BudgetLockProvider, useBudgetLock } from "@/components/budget/BudgetLockContext";
import { BudgetLockTabBanner } from "@/components/budget/BudgetLockTabBanner";
import { BudgetLockCountdown } from "@/components/budget/BudgetLockCountdown";
import { formatLockEndShort } from "@/lib/budget-lock-display";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { profileEngineHref } from "@/lib/profile-routes";

type TabId = "overview" | "execute" | "analysis" | "optimization" | "lock";
type LegacyTabId = TabId | "tactical" | "goals";

type Props = {
  initialTab: LegacyTabId;
  isHistoryView: boolean;
  historyMode: boolean;
  /** Opens Execute tab + scrolls to #budget-lock-control (lock card is only mounted there). */
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
};

function BudgetLockStrip({
  historyMode,
  lockPanelHref,
  embedded = false,
}: {
  historyMode: boolean;
  lockPanelHref: string;
  /** Inside simplified card: no sticky, flush with layout. */
  embedded?: boolean;
}) {
  const { lockActive, lockUntilAt } = useBudgetLock();
  if (historyMode || !lockActive) return null;
  const untilShort = lockUntilAt ? formatLockEndShort(lockUntilAt) : null;
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/50 bg-amber-500/[0.18] px-3 py-2.5 text-xs text-amber-50 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-md ${
        embedded
          ? "mx-2 mb-0 mt-0 shrink-0 rounded-lg border-amber-400/45"
          : "sticky top-0 z-[25] mb-3"
      }`}
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
}: Props) {
  const normalizeInitialTab = (tab: LegacyTabId): TabId => {
    if (tab === "tactical" || tab === "goals") return "execute";
    return tab;
  };
  const [activeTab, setActiveTab] = useState<TabId>(normalizeInitialTab(initialTab));
  const tabs: Array<{ id: TabId; label: string; hidden?: boolean }> = [
    { id: "overview", label: "Status" },
    { id: "execute", label: "Execute", hidden: historyMode },
    { id: "analysis", label: "Intelligence" },
    { id: "optimization", label: "Optimization" },
    { id: "lock", label: "Lock", hidden: historyMode },
  ];

  const setTab = (tab: TabId) => {
    if (tab === "execute" && historyMode) return;
    setActiveTab(tab);
  };

  const tabClass = (tab: TabId) =>
    `dashboard-mini-btn ${
      activeTab === tab ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"
    }`;

  const tabTrack = (
    <div className="dashboard-top-strip-track" role="tablist" aria-label="Budget views">
      {tabs.map((tab) =>
        tab.hidden ? null : (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={tabClass(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setTab(tab.id)}
          >
            {tab.label}
          </button>
        ),
      )}
      {!historyMode && lockActive && (
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/55 bg-amber-500/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-100 shadow-sm"
          title="No-spend lock staat aan"
        >
          <span aria-hidden>🔒</span>
          Lock
        </span>
      )}
      <span className="dashboard-mini-strip-label">View</span>
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
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--card-border)]/40 px-4 py-3">
              <h2 className="hq-h2 min-w-0 flex-1 text-[var(--text-primary)]">Budget</h2>
              <Link
                href="/dashboard"
                className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] underline-offset-2 hover:underline"
              >
                HQ
              </Link>
            </div>
            {simplifiedTopSlot ? (
              <div className="shrink-0 border-b border-[var(--card-border)]/30 px-3 py-2">{simplifiedTopSlot}</div>
            ) : null}
            <BudgetLockStrip historyMode={historyMode} lockPanelHref={lockPanelHref} embedded />
            <div className="dashboard-top-strip sticky top-0 z-20 shrink-0 border-b border-[var(--card-border)]/50 bg-[var(--bg-surface)]/85 px-1 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg-surface)]/70 sm:px-2">
              {tabTrack}
            </div>
            {headerRight ? <div className="shrink-0 border-b border-[var(--card-border)]/30 px-2 py-2">{headerRight}</div> : null}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 [-webkit-overflow-scrolling:touch] sm:px-3">
              {panels}
            </div>
            <p className="shrink-0 border-t border-[var(--card-border)]/40 px-4 py-2 text-center text-[11px] text-[var(--text-muted)]">
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
      ) : (
        <>
          <div className="space-y-3">
            <div className="dashboard-top-strip">{tabTrack}</div>
            {headerRight}
          </div>

          <BudgetLockStrip historyMode={historyMode} lockPanelHref={lockPanelHref} />

          <div className="mt-4">{panels}</div>
        </>
      )}
    </BudgetLockProvider>
  );
}
