"use client";

import { useState } from "react";
import { BudgetLockProvider, useBudgetLock } from "@/components/budget/BudgetLockContext";

type TabId = "overview" | "execute" | "analysis" | "optimization";
type LegacyTabId = TabId | "tactical" | "goals";

type Props = {
  initialTab: LegacyTabId;
  isHistoryView: boolean;
  historyMode: boolean;
  headerRight: React.ReactNode;
  overview: React.ReactNode;
  tactical: React.ReactNode;
  analysis: React.ReactNode;
  goals: React.ReactNode;
  optimization: React.ReactNode;
  lockActive: boolean;
  lockUntil: string | null;
};

function BudgetLockStrip({ historyMode }: { historyMode: boolean }) {
  const { lockActive, lockUntil } = useBudgetLock();
  if (historyMode || !lockActive) return null;
  return (
    <div
      className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/45 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
      role="status"
    >
      <span>
        <strong className="text-amber-200">No-spend lock</strong>
        {lockUntil ? ` · tot ${lockUntil}` : ""} — snel loggen is geblokkeerd op deze tab; gebruik het noodpad onderaan Execute.
      </span>
      <a
        href="#budget-lock-control"
        className="shrink-0 font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline"
      >
        Naar lock / nooduitgave
      </a>
    </div>
  );
}

export function BudgetTabsShell({
  initialTab,
  isHistoryView: _isHistoryView,
  historyMode,
  headerRight,
  overview,
  tactical,
  analysis,
  goals,
  optimization,
  lockActive,
  lockUntil,
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
    <BudgetLockProvider value={{ lockActive: lockActive && !historyMode, lockUntil }}>
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
            <span className="dashboard-mini-strip-label">View</span>
          </div>
        </div>
        {headerRight}
      </div>

      <BudgetLockStrip historyMode={historyMode} />

      <div className="mt-4">
        {activeTab === "overview" && <div key="panel-overview">{overview}</div>}
        {activeTab === "execute" && !historyMode && (
          <div key="panel-execute" className="space-y-4">
            {tactical}
            {goals}
          </div>
        )}
        {activeTab === "analysis" && <div key="panel-analysis">{analysis}</div>}
        {activeTab === "optimization" && <div key="panel-optimization">{optimization}</div>}
      </div>
    </BudgetLockProvider>
  );
}
