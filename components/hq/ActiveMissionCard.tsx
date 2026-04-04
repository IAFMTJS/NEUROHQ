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
  isTimeWindowActive: _isTimeWindowActive = false,
}: Props) {
  const href = tasks.length > 0 ? "/tasks" : emptyHref;
  const isPlural = tasks.length !== 1;

  return (
    <article
      className="hq-card-enter card-simple relative mx-auto w-full overflow-visible dashboard-active-mission space-y-4 p-6"
    >
      <h2 className="hq-h2 text-[var(--text-primary)]">
        Active mission{isPlural ? "s" : ""}
      </h2>
      <div className="h-px w-full bg-[var(--border-soft)]" aria-hidden />

      {tasks.length > 0 ? (
        <ul className="space-y-2" aria-label="Today's missions">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-center gap-2 border-l-2 border-[var(--accent-focus)]/55 pl-3 text-[var(--text-secondary)] ${
                task.carryOverCount && task.carryOverCount > 0 ? "dashboard-mission-item-carry rounded-r-lg py-1 pr-2" : ""
              }`}
            >
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
        <p className="text-sm text-[var(--text-muted)]">{emptyMessage}</p>
      )}

      <p className="text-sm text-[var(--accent-focus)]">
        Best time: {timeWindow.replace("–", " – ")}
      </p>

      <div className="mission-cta-wrap flex justify-center pt-1">
        <Link
          href={href}
          aria-label={tasks.length > 0 ? "Go to missions" : "Begin mission"}
          className="mission-cta-button btn-primary inline-flex min-w-[200px] items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold no-underline"
        >
          {tasks.length > 0 ? "Go to missions" : "Begin mission"} →
        </Link>
      </div>
    </article>
  );
}
