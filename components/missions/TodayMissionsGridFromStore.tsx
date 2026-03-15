"use client";

import { useHQStore } from "@/lib/hq-store";
import { CommanderMissionCard } from "@/components/commander";
import type { Task } from "@/types/database.types";

type Props = {
  dateStr: string;
  /** Server-rendered mission cards when store is empty (e.g. recommended from UMS). */
  children?: React.ReactNode;
};

/**
 * Renders today's missions from the HQ store so that when the user adds or moves
 * a mission, it appears immediately in the mission cards section as well as in the
 * TaskList and on the dashboard Active Mission card (all read from the same store).
 * When the store has no tasks for today, renders children (server-rendered cards).
 */
export function TodayMissionsGridFromStore({ dateStr, children }: Props) {
  const storeTasks = useHQStore((s) => (s.tasksByDate[dateStr] ?? []) as Task[]);
  const incomplete = storeTasks.filter((t) => !(t as { completed?: boolean }).completed);

  if (incomplete.length > 0) {
    return (
      <section className="mission-grid" aria-label="Today's missions">
        {incomplete.map((t, i) => (
          <CommanderMissionCard
            key={t.id}
            id={t.id}
            title={t.title ?? "Task"}
            subtitle={i === 0 ? "Active" : undefined}
            state="active"
            progressPct={0}
            href="/tasks"
          />
        ))}
      </section>
    );
  }

  return <>{children}</>;
}
