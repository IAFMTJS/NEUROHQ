"use client";

import { useState, type ReactNode } from "react";

type TabId = "command" | "signals" | "workspace" | "trajectory";

type Props = {
  commandPanel: ReactNode;
  signalsPanel: ReactNode;
  workspacePanel: ReactNode;
  trajectoryPanel: ReactNode;
};

const tabs: Array<{ id: TabId; label: string; hint: string }> = [
  { id: "command", label: "Command", hint: "Sturen en instellen" },
  { id: "signals", label: "Signals", hint: "Parity, momentum, sync" },
  { id: "workspace", label: "Workspace", hint: "Volledige growth-omgeving" },
  { id: "trajectory", label: "Traject", hint: "Volledig protocol van 0 tot 100%" },
];

export function GrowthReimaginedBTabShell({ commandPanel, signalsPanel, workspacePanel, trajectoryPanel }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("command");

  return (
    <section className="rounded-2xl border border-white/10 bg-black/20 p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                selected
                  ? "border-cyan-300/55 bg-cyan-500/18 text-cyan-100"
                  : "border-white/15 bg-black/20 text-slate-300 hover:border-white/30 hover:text-white"
              }`}
              title={tab.hint}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {activeTab === "command" ? <div className="space-y-4">{commandPanel}</div> : null}
        {activeTab === "signals" ? <div className="space-y-4">{signalsPanel}</div> : null}
        {activeTab === "workspace" ? <div className="space-y-4">{workspacePanel}</div> : null}
        {activeTab === "trajectory" ? <div className="space-y-4">{trajectoryPanel}</div> : null}
      </div>
    </section>
  );
}
