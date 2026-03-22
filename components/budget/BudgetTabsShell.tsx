"use client";

import { useState } from "react";
import { BudgetLockProvider, useBudgetLock } from "@/components/budget/BudgetLockContext";
import { BudgetLockTabBanner } from "@/components/budget/BudgetLockTabBanner";
import { BudgetLockCountdown } from "@/components/budget/BudgetLockCountdown";
import { formatLockEndShort } from "@/lib/budget-lock-display";

type TabId = "overview" | "execute" | "analysis" | "optimization";
type LegacyTabId = TabId | "tactical" | "goals";

type Props = {
  initialTab: LegacyTabId;
  isHistoryView: boolean;
  historyMode: boolean;
  /** Opens Execute tab + scrolls to #budget-lock-control (lock card is only mounted there). */
  lockPanelHref: string;
  headerRight: React.ReactNode;
  overview: React.ReactNode;
  tactical: React.ReactNode;
  analysis: React.ReactNode;
  goals: React.ReactNode;
  optimization: React.ReactNode;
  lockActive: boolean;
  lockUntil: string | null;
  lockUntilAt: string | null;
};

function BudgetLockStrip({ historyMode, lockPanelHref }: { historyMode: boolean; lockPanelHref: string }) {
  const { lockActive, lockUntilAt } = useBudgetLock();
  if (historyMode || !lockActive) return null;
  const untilShort = lockUntilAt ? formatLockEndShort(lockUntilAt) : null;
  return (
    <div
      className="sticky top-0 z-[25] mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/50 bg-amber-500/[0.18] px-3 py-2.5 text-xs text-amber-50 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-md"
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
  lockActive,
  lockUntil,
  lockUntilAt,
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
  ];

  const setTab = (tab: TabId) => {
    if (tab === "execute" && historyMode) return;
    setActiveTab(tab);
  };

  const tabClass = (tab: TabId) =>
    `dashboard-mini-btn ${
      activeTab === tab ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"
    }`;

  return (
    <BudgetLockProvider value={{ lockActive: lockActive && !historyMode, lockUntil, lockUntilAt }}>
      <div className="space-y-3">
        <div className="dashboard-top-strip">
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
        </div>
        {headerRight}
      </div>

      <BudgetLockStrip historyMode={historyMode} lockPanelHref={lockPanelHref} />

      <div className="mt-4">
        {activeTab === "overview" && <div key="panel-overview">{overview}</div>}
        {activeTab === "execute" && !historyMode && (
          <div key="panel-execute" className="space-y-4">
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
      </div>
    </BudgetLockProvider>
  );
}
