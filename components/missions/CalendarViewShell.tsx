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
        ? "font-medium"
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
          <p className="rounded-lg border border-dashed px-3 py-2 text-xs" style={{ borderColor: "rgba(var(--mode-rgb),0.3)", color: "rgba(var(--mode-rgb),0.7)" }}>
            Geen routines voor deze dag.
          </p>
        );
      }
      return (
        <ul className="space-y-1.5">
          {selectedDayRoutines.map((task) => (
            <li
              key={task.id}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "rgba(var(--mode-rgb),0.15)", background: "rgba(var(--mode-rgb-deep),0.25)" }}
            >
              <span className={task.completed ? "line-through" : ""} style={{ color: task.completed ? "rgba(var(--mode-rgb),0.45)" : "rgba(var(--mode-rgb),0.95)" }}>
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
          <p className="rounded-lg border border-dashed px-3 py-2 text-xs" style={{ borderColor: "rgba(var(--mode-rgb),0.3)", color: "rgba(var(--mode-rgb),0.7)" }}>
            Geen overdue missies. Nice.
          </p>
        );
      }
      return (
        <ul className="space-y-1.5">
          {overdueTasks.slice(0, 12).map((task) => (
            <li
              key={task.id}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "rgba(var(--mode-rgb),0.15)", background: "rgba(var(--mode-rgb-deep),0.25)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate" style={{ color: "rgba(var(--mode-rgb),0.95)" }}>{task.title ?? "Untitled task"}</span>
                {task.due_date && (
                  <span className="shrink-0 text-[11px]" style={{ color: "rgba(var(--mode-rgb),0.65)" }}>{task.due_date}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      );
    }

    if (selectedDayTasks.length === 0) {
      return (
        <p className="rounded-lg border border-dashed px-3 py-2 text-xs" style={{ borderColor: "rgba(var(--mode-rgb),0.3)", color: "rgba(var(--mode-rgb),0.7)" }}>
          Geen missies voor deze dag.
        </p>
      );
    }

    return (
      <ul className="space-y-1.5">
        {selectedDayTasks.map((task) => (
          <li
            key={task.id}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "rgba(var(--mode-rgb),0.15)", background: "rgba(var(--mode-rgb-deep),0.25)" }}
          >
            <span className={task.completed ? "line-through" : ""} style={{ color: task.completed ? "rgba(var(--mode-rgb),0.45)" : "rgba(var(--mode-rgb),0.95)" }}>
              {task.title ?? "Untitled task"}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: "rgba(var(--mode-rgb),0.2)", background: "linear-gradient(180deg, rgba(var(--mode-rgb-deep),0.28), rgba(var(--mode-rgb),0.14))" }}>
      <h3 className="text-base font-semibold" style={{ color: "rgba(var(--mode-rgb),0.95)" }}>{heading}</h3>

      {/* Events block only hidden for overdue view */}
      {view !== "overdue" && (
        <div className="mt-3 space-y-2">
          {selectedDayEvents.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-2 text-xs" style={{ borderColor: "rgba(var(--mode-rgb),0.3)", color: "rgba(var(--mode-rgb),0.7)" }}>
              Geen agenda items voor deze dag.
            </p>
          ) : (
            selectedDayEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border px-3 py-2.5"
                style={{ borderColor: "rgba(var(--mode-rgb),0.2)", background: "rgba(var(--mode-rgb-deep),0.32)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: "rgba(var(--mode-rgb),0.95)" }}>
                      {event.title ?? "Untitled"}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "rgba(var(--mode-rgb),0.65)" }}>
                      {event.is_social ? "Social" : "Work"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold" style={{ color: "rgba(var(--mode-rgb),0.9)" }}>
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

      <div className="mt-3 border-t pt-3" style={{ borderColor: "rgba(var(--mode-rgb),0.2)" }}>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(var(--mode-rgb),0.65)" }}>
          {view === "routines"
            ? "Routine tasks"
            : view === "overdue"
              ? "Open overdue list"
              : "Tasks"}
        </h4>
        {renderTasks()}
      </div>

      {/* View chips - local state only, no navigation */}
      <div className="mt-4 inline-flex rounded-full border p-1 text-[11px]" style={{ borderColor: "rgba(var(--mode-rgb),0.25)", background: "rgba(var(--mode-rgb-deep),0.35)" }}>
        <button
          type="button"
          className={chipClass("today")}
          style={view === "today" ? { background: "rgba(var(--mode-rgb),0.2)", color: "rgba(var(--mode-rgb),0.95)" } : undefined}
          onClick={() => setView("today")}
        >
          Today
        </button>
        <button
          type="button"
          className={chipClass("calendar")}
          style={view === "calendar" ? { background: "rgba(var(--mode-rgb),0.2)", color: "rgba(var(--mode-rgb),0.95)" } : undefined}
          onClick={() => setView("calendar")}
        >
          Calendar
        </button>
        <button
          type="button"
          className={chipClass("routines")}
          style={view === "routines" ? { background: "rgba(var(--mode-rgb),0.2)", color: "rgba(var(--mode-rgb),0.95)" } : undefined}
          onClick={() => setView("routines")}
        >
          Routines
        </button>
        <button
          type="button"
          className={chipClass("overdue")}
          style={view === "overdue" ? { background: "rgba(var(--mode-rgb),0.2)", color: "rgba(var(--mode-rgb),0.95)" } : undefined}
          onClick={() => setView("overdue")}
        >
          Overdue
        </button>
      </div>
    </div>
  );
}

