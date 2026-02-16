"use client";

import Link from "next/link";

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
    <section
      className="glass-card glass-card-glow-cyan hq-card-enter relative w-full mx-auto overflow-visible"
      style={{ animationDelay: "100ms" }}
      aria-label="Active missions"
    >
      <div className="relative z-10 p-6 space-y-4">
        <h2 className="hq-h2 text-[var(--text-primary)]">
          Active mission{isPlural ? "s" : ""}
        </h2>

        {tasks.length > 0 ? (
          <ul className="space-y-2" aria-label="Today's missions">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`flex items-center gap-2 text-[var(--text-secondary)] ${task.carryOverCount && task.carryOverCount > 0 ? "rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1" : ""}`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${task.carryOverCount && task.carryOverCount > 0 ? "bg-amber-500" : "bg-[var(--accent-focus)]"}`}
                  aria-hidden
                />
                <span className="font-medium text-[var(--text-primary)]">{task.title}</span>
                {task.carryOverCount && task.carryOverCount > 0 && (
                  <span className="ml-auto rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
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

        <div className="pt-4 flex justify-center">
          <Link
            href={href}
            className="space-btn inline-flex items-center justify-center gap-2 px-6 py-2 text-[14px] sm:text-base"
            aria-label={tasks.length > 0 ? "Go to missions" : "Begin mission"}
          >
            {tasks.length > 0 ? "GO TO MISSIONS" : "BEGIN MISSION"} →
          </Link>
        </div>

        <p className="text-center text-[var(--text-muted)] text-xs pt-2">
          All systems active
        </p>
      </div>
    </section>
  );
}
