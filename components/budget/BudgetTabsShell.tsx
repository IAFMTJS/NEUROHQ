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
        ? "border text-[var(--mode-text-strong,#eaf8ff)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(11,30,46,0.55)]"
    }`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap gap-1 rounded-xl border p-1.5 backdrop-blur-sm"
          style={{
            borderColor: "rgba(var(--mode-rgb, 0, 212, 255), 0.28)",
            background: "rgba(var(--mode-rgb-deep, 0, 136, 255), 0.26)",
          }}
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
                style={
                  activeTab === tab.id
                    ? {
                        borderColor: "rgba(var(--mode-rgb, 0, 212, 255), 0.44)",
                        background:
                          "linear-gradient(180deg, rgba(var(--mode-rgb-deep, 0, 136, 255), 0.85), rgba(var(--mode-rgb, 0, 212, 255), 0.42))",
                        boxShadow: "0 0 14px rgba(var(--mode-rgb, 0, 212, 255), 0.24)",
                      }
                    : undefined
                }
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
