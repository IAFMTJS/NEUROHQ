"use client";

import { useState } from "react";

type CalendarView = "today" | "calendar" | "routines" | "overdue";

type CalendarEvent = {
  id: string;
  title: string | null;
  start_at: string;
  end_at: string;
  is_social: boolean;
  source: string | null;
};

type CalendarTask = {
  id: string;
  title: string | null;
  completed?: boolean;
};

type OverdueTask = {
  id: string;
  title: string | null;
  due_date: string | null;
};

type Props = {
  initialView: CalendarView;
  selectedDayLabel: string;
  selectedDayEvents: CalendarEvent[];
  selectedDayTasks: CalendarTask[];
  selectedDayRoutines: CalendarTask[];
  overdueTasks: OverdueTask[];
};

export function CalendarViewShell({
  initialView,
  selectedDayLabel,
  selectedDayEvents,
  selectedDayTasks,
  selectedDayRoutines,
  overdueTasks,
}: Props) {
  const [view, setView] = useState<CalendarView>(initialView);

  const chipClass = (target: CalendarView) =>
    `rounded-full px-3 py-1 ${
      view === target
        ? "bg-cyan-400/20 font-medium text-cyan-100"
        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
    }`;

  const heading =
    view === "overdue"
      ? "Overdue missions"
      : view === "routines"
        ? `Routines · ${selectedDayLabel}`
        : selectedDayLabel;

  const renderTasks = () => {
    if (view === "routines") {
      if (selectedDayRoutines.length === 0) {
        return (
          <p className="rounded-lg border border-dashed border-cyan-400/30 px-3 py-2 text-xs text-cyan-100/70">
            Geen routines voor deze dag.
          </p>
        );
      }
      return (
        <ul className="space-y-1.5">
          {selectedDayRoutines.map((task) => (
            <li
              key={task.id}
              className="rounded-lg border border-cyan-500/15 bg-[rgba(6,20,34,0.5)] px-3 py-2 text-sm"
            >
              <span className={task.completed ? "text-cyan-100/45 line-through" : "text-cyan-50"}>
                {task.title ?? "Untitled task"}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    if (view === "overdue") {
      if (overdueTasks.length === 0) {
        return (
          <p className="rounded-lg border border-dashed border-cyan-400/30 px-3 py-2 text-xs text-cyan-100/70">
            Geen overdue missies. Nice.
          </p>
        );
      }
      return (
        <ul className="space-y-1.5">
          {overdueTasks.slice(0, 12).map((task) => (
            <li
              key={task.id}
              className="rounded-lg border border-cyan-500/15 bg-[rgba(6,20,34,0.5)] px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-cyan-50">{task.title ?? "Untitled task"}</span>
                {task.due_date && (
                  <span className="shrink-0 text-[11px] text-cyan-100/65">{task.due_date}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      );
    }

    if (selectedDayTasks.length === 0) {
      return (
        <p className="rounded-lg border border-dashed border-cyan-400/30 px-3 py-2 text-xs text-cyan-100/70">
          Geen missies voor deze dag.
        </p>
      );
    }

    return (
      <ul className="space-y-1.5">
        {selectedDayTasks.map((task) => (
          <li
            key={task.id}
            className="rounded-lg border border-cyan-500/15 bg-[rgba(6,20,34,0.5)] px-3 py-2 text-sm"
          >
            <span className={task.completed ? "text-cyan-100/45 line-through" : "text-cyan-50"}>
              {task.title ?? "Untitled task"}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(8,23,42,0.7),rgba(5,15,30,0.84))] p-3">
      <h3 className="text-base font-semibold text-cyan-50">{heading}</h3>

      {/* Events block only hidden for overdue view */}
      {view !== "overdue" && (
        <div className="mt-3 space-y-2">
          {selectedDayEvents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-cyan-400/30 px-3 py-2 text-xs text-cyan-100/70">
              Geen agenda items voor deze dag.
            </p>
          ) : (
            selectedDayEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-cyan-500/20 bg-[rgba(6,20,34,0.68)] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-cyan-50">
                      {event.title ?? "Untitled"}
                    </p>
                    <p className="mt-0.5 text-xs text-cyan-100/65">
                      {event.is_social ? "Social" : "Work"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-cyan-100/90">
                    {new Date(event.start_at).toLocaleTimeString("nl-NL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-3 border-t border-cyan-500/20 pt-3">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-100/65">
          {view === "routines"
            ? "Routine tasks"
            : view === "overdue"
              ? "Open overdue list"
              : "Tasks"}
        </h4>
        {renderTasks()}
      </div>

      {/* View chips - local state only, no navigation */}
      <div className="mt-4 inline-flex rounded-full border border-cyan-400/25 bg-[rgba(8,22,38,0.82)] p-1 text-[11px]">
        <button
          type="button"
          className={chipClass("today")}
          onClick={() => setView("today")}
        >
          Today
        </button>
        <button
          type="button"
          className={chipClass("calendar")}
          onClick={() => setView("calendar")}
        >
          Calendar
        </button>
        <button
          type="button"
          className={chipClass("routines")}
          onClick={() => setView("routines")}
        >
          Routines
        </button>
        <button
          type="button"
          className={chipClass("overdue")}
          onClick={() => setView("overdue")}
        >
          Overdue
        </button>
      </div>
    </div>
  );
}

