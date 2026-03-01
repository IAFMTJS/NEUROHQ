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
  isHistoryView,
  historyMode,
  headerRight,
  overview,
  tactical,
  analysis,
  goals,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const setTab = (tab: TabId) => {
    if (tab === "tactical" && historyMode) return;
    setActiveTab(tab);
  };

  const tabClass = (tab: TabId) =>
    `px-3 py-1.5 rounded-full transition-colors ${
      activeTab === tab
        ? "bg-[var(--accent-primary)]/20 text-[var(--text-primary)]"
        : "hover:bg-[var(--bg-primary)]/60"
    }`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-full border border-[var(--card-border)] bg-[var(--bg-surface)]/80 p-1 text-xs font-medium text-[var(--text-muted)]"
          role="tablist"
          aria-label="Budget views"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            className={tabClass("overview")}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          {!historyMode && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "tactical"}
              className={tabClass("tactical")}
              onClick={() => setTab("tactical")}
            >
              Tactical Control
            </button>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "analysis"}
            className={tabClass("analysis")}
            onClick={() => setTab("analysis")}
          >
            Analysis
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "goals"}
            className={tabClass("goals")}
            onClick={() => setTab("goals")}
          >
            Goals &amp; Recurring
          </button>
        </div>
        {headerRight}
      </div>

      {activeTab === "overview" && overview}
      {activeTab === "tactical" && !historyMode && tactical}
      {activeTab === "analysis" && analysis}
      {activeTab === "goals" && goals}
    </>
  );
}

