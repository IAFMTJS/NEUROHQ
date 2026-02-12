"use client";

import Link from "next/link";

export type TaskForMission = { id: string; title: string };

type Props = {
  /** All tasks/missions for today. When empty, emptyMessage and emptyHref are used. */
  tasks: TaskForMission[];
  /** Shown when there are no tasks (e.g. "No mission for today" or learning prompt). */
  emptyMessage: string;
  /** Link when there are no tasks (e.g. /tasks or /learning). */
  emptyHref?: string;
  timeWindow: string;
  /** When true, primary button gets subtle animated glow border */
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
      className="hq-card-mission hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5"
      style={{ animationDelay: "100ms" }}
      aria-label="Active missions"
    >
      <h2 className="hq-h2 mb-4">
        Active mission{isPlural ? "s" : ""}
      </h2>
      {tasks.length > 0 ? (
        <ul className="mb-3 space-y-2" aria-label="Today's missions">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2 text-[var(--text-primary)]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-focus)]" aria-hidden />
              <span className="font-medium">{task.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hq-body mb-3">{emptyMessage}</p>
      )}
      <p className="hq-label mb-4 text-[var(--text-muted)]">
        Optimal time frame: {timeWindow.replace("–", " - ")}
      </p>
      <Link
        href={href}
        className={`btn-hq-primary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-4 px-4 text-[15px] ${
          isTimeWindowActive ? "btn-hq-primary-time-window" : ""
        }`}
      >
        {tasks.length > 0 ? "GO TO MISSIONS" : "BEGIN MISSION"}
      </Link>
    </section>
  );
}
