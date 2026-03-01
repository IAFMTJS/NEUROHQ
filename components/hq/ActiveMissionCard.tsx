"use client";

import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { HudLinkButton } from "@/components/hud-test/HudLinkButton";
import { Divider1px } from "@/components/hud-test/Divider1px";
import { CornerNode } from "@/components/hud-test/CornerNode";

export type TaskForMission = { id: string; title: string; carryOverCount?: number };

type Props = {
  tasks: TaskForMission[];
  emptyMessage: string;
  emptyHref?: string;
  timeWindow: string;
  isTimeWindowActive?: boolean;
};

export function ActiveMissionCard({
  tasks,
  emptyMessage,
  emptyHref = "/tasks",
  timeWindow,
  isTimeWindowActive = false,
}: Props) {
  const href = tasks.length > 0 ? "/tasks" : emptyHref;
  const isPlural = tasks.length !== 1;

  return (
    <SciFiPanel
      className="hq-card-enter relative w-full mx-auto overflow-visible dashboard-active-mission"
      bodyClassName="relative z-10 p-6 space-y-4"
      variant="command"
    >
        <CornerNode corner="top-left" />
        <CornerNode corner="top-right" />
        <h2 className="hq-h2 text-[var(--text-primary)]">
          Active mission{isPlural ? "s" : ""}
        </h2>
        <Divider1px className="my-2" />

        {tasks.length > 0 ? (
          <ul className="space-y-2" aria-label="Today's missions">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`dashboard-mission-item flex items-center gap-2 text-[var(--text-secondary)] ${task.carryOverCount && task.carryOverCount > 0 ? "dashboard-mission-item-carry px-2 py-1" : ""}`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${task.carryOverCount && task.carryOverCount > 0 ? "bg-[#ffbf8e]" : "bg-[var(--accent-focus)]"}`}
                  aria-hidden
                />
                <span className="font-medium text-[var(--text-primary)]">{task.title}</span>
                {task.carryOverCount && task.carryOverCount > 0 && (
                  <span className="dashboard-mission-item-carry-badge ml-auto px-1.5 py-0.5 text-[10px] font-medium">
                    Carried over
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--text-muted)] text-sm">{emptyMessage}</p>
        )}

        <p className="text-[var(--accent-focus)] text-sm tracking-widest uppercase">
          Optimal time frame: {timeWindow.replace("–", " – ")}
        </p>

        <div className="mission-cta-wrap pt-1 flex justify-center">
          <HudLinkButton
            href={href}
            aria-label={tasks.length > 0 ? "Go to missions" : "Begin mission"}
            tone="glass"
            className="gap-2 mission-cta-button min-w-[220px] rounded-full px-7"
          >
            {tasks.length > 0 ? "GO TO MISSIONS" : "BEGIN MISSION"} →
          </HudLinkButton>
        </div>

        <p className="text-center text-[var(--text-muted)] text-xs pt-1.5">
          All systems active
        </p>
    </SciFiPanel>
  );
}
