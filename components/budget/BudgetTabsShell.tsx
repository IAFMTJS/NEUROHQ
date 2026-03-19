"use client";

import { useState } from "react";

type TabId = "overview" | "tactical" | "analysis" | "goals";

type Props = {
  initialTab: TabId;
  isHistoryView: boolean;
  historyMode: boolean;
  headerRight: React.ReactNode;
  overview: React.ReactNode;
  tactical: React.ReactNode;
  analysis: React.ReactNode;
  goals: React.ReactNode;
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
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const tabs: Array<{ id: TabId; label: string; hidden?: boolean }> = [
    { id: "overview", label: "Daily Command" },
    { id: "tactical", label: "Planning & Execution", hidden: historyMode },
    { id: "analysis", label: "Behavioral Intelligence" },
    { id: "goals", label: "Goals & Ledger" },
  ];

  const setTab = (tab: TabId) => {
    if (tab === "tactical" && historyMode) return;
    setActiveTab(tab);
  };

  const tabClass = (tab: TabId) =>
    `rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
      activeTab === tab
        ? "border border-cyan-300/40 bg-[linear-gradient(180deg,rgba(11,63,111,0.85),rgba(11,94,150,0.55))] text-[#eaf8ff] shadow-[0_0_14px_rgba(0,212,255,0.24)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(11,30,46,0.55)]"
    }`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap gap-1 rounded-xl border border-[rgba(0,200,255,0.24)] bg-[rgba(10,22,35,0.56)] p-1.5 backdrop-blur-sm"
          role="tablist"
          aria-label="Budget views"
        >
          {tabs.map((tab) =>
            tab.hidden ? null : (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={tabClass(tab.id)}
                onClick={() => setTab(tab.id)}
              >
                {tab.label}
              </button>
            ),
          )}
        </div>
        {headerRight}
      </div>

      <div className="mt-4">
        {activeTab === "overview" && <div key="panel-overview">{overview}</div>}
        {activeTab === "tactical" && !historyMode && <div key="panel-tactical">{tactical}</div>}
        {activeTab === "analysis" && <div key="panel-analysis">{analysis}</div>}
        {activeTab === "goals" && <div key="panel-goals">{goals}</div>}
      </div>
    </>
  );
}
