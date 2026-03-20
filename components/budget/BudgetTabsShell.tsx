"use client";

import { useState } from "react";

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
};

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
    <>
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
    </>
  );
}
