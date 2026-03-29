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
  /** Nested in card-simple on /tasks command deck — skip outer chrome. */
  commandDeckVisuals?: boolean;
};

export function CalendarViewShell({
  initialView,
  selectedDayLabel,
  selectedDayEvents,
  selectedDayTasks,
  selectedDayRoutines,
  overdueTasks,
  commandDeckVisuals = false,
}: Props) {
  const [view, setView] = useState<CalendarView>(initialView);

  const chipClass = (target: CalendarView) =>
    `rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${
      view === target
        ? "text-[var(--accent-focus)]"
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
          <p
            className={
              commandDeckVisuals
                ? "rounded-lg border border-dashed border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.25)] px-3 py-2 text-xs text-[var(--text-muted)]"
                : "rounded-lg border border-dashed px-3 py-2 text-xs"
            }
            style={
              commandDeckVisuals
                ? undefined
                : { borderColor: "rgba(var(--mode-rgb),0.3)", color: "rgba(var(--mode-rgb),0.7)" }
            }
          >
            Geen routines voor deze dag.
          </p>
        );
      }
      const rowClass = commandDeckVisuals
        ? "rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] px-3 py-2 text-sm"
        : "rounded-lg border px-3 py-2 text-sm";
      const rowStyle = commandDeckVisuals ? undefined : { borderColor: "rgba(var(--mode-rgb),0.15)", background: "rgba(var(--mode-rgb-deep),0.25)" };
      return (
        <ul className="space-y-1.5">
          {selectedDayRoutines.map((task) => (
            <li key={task.id} className={rowClass} style={rowStyle}>
              <span
                className={task.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}
                style={commandDeckVisuals ? undefined : { color: task.completed ? "rgba(var(--mode-rgb),0.45)" : "rgba(var(--mode-rgb),0.95)" }}
              >
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
          <p
            className={
              commandDeckVisuals
                ? "rounded-lg border border-dashed border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.25)] px-3 py-2 text-xs text-[var(--text-muted)]"
                : "rounded-lg border border-dashed px-3 py-2 text-xs"
            }
            style={commandDeckVisuals ? undefined : { borderColor: "rgba(var(--mode-rgb),0.3)", color: "rgba(var(--mode-rgb),0.7)" }}
          >
            Geen overdue missies. Nice.
          </p>
        );
      }
      const rowClassOd = commandDeckVisuals
        ? "rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] px-3 py-2 text-sm"
        : "rounded-lg border px-3 py-2 text-sm";
      const rowStyleOd = commandDeckVisuals ? undefined : { borderColor: "rgba(var(--mode-rgb),0.15)", background: "rgba(var(--mode-rgb-deep),0.25)" };
      return (
        <ul className="space-y-1.5">
          {overdueTasks.slice(0, 12).map((task) => (
            <li key={task.id} className={rowClassOd} style={rowStyleOd}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[var(--text-primary)]" style={commandDeckVisuals ? undefined : { color: "rgba(var(--mode-rgb),0.95)" }}>
                  {task.title ?? "Untitled task"}
                </span>
                {task.due_date && (
                  <span
                    className="shrink-0 text-[11px] tabular-nums text-[var(--text-muted)]"
                    style={commandDeckVisuals ? undefined : { color: "rgba(var(--mode-rgb),0.65)" }}
                  >
                    {task.due_date}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      );
    }

    if (selectedDayTasks.length === 0) {
      return (
        <p
          className={
            commandDeckVisuals
              ? "rounded-lg border border-dashed border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.25)] px-3 py-2 text-xs text-[var(--text-muted)]"
              : "rounded-lg border border-dashed px-3 py-2 text-xs"
          }
          style={commandDeckVisuals ? undefined : { borderColor: "rgba(var(--mode-rgb),0.3)", color: "rgba(var(--mode-rgb),0.7)" }}
        >
          Geen missies voor deze dag.
        </p>
      );
    }

    const rowClassT = commandDeckVisuals
      ? "rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] px-3 py-2 text-sm"
      : "rounded-lg border px-3 py-2 text-sm";
    const rowStyleT = commandDeckVisuals ? undefined : { borderColor: "rgba(var(--mode-rgb),0.15)", background: "rgba(var(--mode-rgb-deep),0.25)" };
    return (
      <ul className="space-y-1.5">
        {selectedDayTasks.map((task) => (
          <li key={task.id} className={rowClassT} style={rowStyleT}>
            <span
              className={task.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}
              style={commandDeckVisuals ? undefined : { color: task.completed ? "rgba(var(--mode-rgb),0.45)" : "rgba(var(--mode-rgb),0.95)" }}
            >
              {task.title ?? "Untitled task"}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const shellClass = commandDeckVisuals ? "space-y-3" : "rounded-2xl border p-3";
  const shellStyle = commandDeckVisuals
    ? undefined
    : {
        borderColor: "rgba(var(--mode-rgb),0.2)",
        background: "linear-gradient(180deg, rgba(var(--mode-rgb-deep),0.28), rgba(var(--mode-rgb),0.14))",
      };
  const dashedEmptyClass = commandDeckVisuals
    ? "rounded-lg border border-dashed border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.25)] px-3 py-2 text-xs text-[var(--text-muted)]"
    : "rounded-lg border border-dashed px-3 py-2 text-xs";
  const dashedEmptyStyle = commandDeckVisuals ? undefined : { borderColor: "rgba(var(--mode-rgb),0.3)", color: "rgba(var(--mode-rgb),0.7)" };
  const eventCardClass = commandDeckVisuals
    ? "rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.4)] px-3 py-2.5"
    : "rounded-xl border px-3 py-2.5";
  const eventCardStyle = commandDeckVisuals
    ? undefined
    : { borderColor: "rgba(var(--mode-rgb),0.2)", background: "rgba(var(--mode-rgb-deep),0.32)" };
  const chipTrackClass = commandDeckVisuals
    ? "mt-4 flex flex-wrap gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)] p-1"
    : "mt-4 inline-flex rounded-full border p-1 text-[11px]";
  const chipTrackStyle = commandDeckVisuals ? undefined : { borderColor: "rgba(var(--mode-rgb),0.25)", background: "rgba(var(--mode-rgb-deep),0.35)" };
  const chipActive = (target: CalendarView) =>
    view === target
      ? commandDeckVisuals
        ? "border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(var(--mode-rgb),0.12)] text-[var(--accent-focus)] shadow-[0_0_12px_rgba(var(--mode-rgb),0.12)]"
        : ""
      : "";

  return (
    <div className={shellClass} style={shellStyle}>
      <h3 className={`text-base font-semibold ${commandDeckVisuals ? "text-[var(--text-primary)]" : ""}`} style={commandDeckVisuals ? undefined : { color: "rgba(var(--mode-rgb),0.95)" }}>
        {heading}
      </h3>

      {view !== "overdue" && (
        <div className="mt-3 space-y-2">
          {selectedDayEvents.length === 0 ? (
            <p className={dashedEmptyClass} style={dashedEmptyStyle}>
              Geen agenda items voor deze dag.
            </p>
          ) : (
            selectedDayEvents.map((event) => (
              <div key={event.id} className={eventCardClass} style={eventCardStyle}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-medium ${commandDeckVisuals ? "text-[var(--text-primary)]" : ""}`} style={commandDeckVisuals ? undefined : { color: "rgba(var(--mode-rgb),0.95)" }}>
                      {event.title ?? "Untitled"}
                    </p>
                    <p className={`mt-0.5 text-xs ${commandDeckVisuals ? "text-[var(--text-muted)]" : ""}`} style={commandDeckVisuals ? undefined : { color: "rgba(var(--mode-rgb),0.65)" }}>
                      {event.is_social ? "Social" : "Work"}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${commandDeckVisuals ? "text-[var(--semantic-accent)]" : ""}`} style={commandDeckVisuals ? undefined : { color: "rgba(var(--mode-rgb),0.9)" }}>
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

      <div className={`mt-3 border-t pt-3 ${commandDeckVisuals ? "border-[rgba(var(--mode-rgb),0.1)]" : ""}`} style={commandDeckVisuals ? undefined : { borderColor: "rgba(var(--mode-rgb),0.2)" }}>
        <h4 className={`mb-2 text-[10px] font-bold uppercase tracking-[0.14em] ${commandDeckVisuals ? "text-[var(--text-muted)]" : ""}`} style={commandDeckVisuals ? undefined : { color: "rgba(var(--mode-rgb),0.65)" }}>
          {view === "routines" ? "Routine tasks" : view === "overdue" ? "Open overdue list" : "Tasks"}
        </h4>
        {renderTasks()}
      </div>

      <div className={chipTrackClass} style={chipTrackStyle}>
        {(["today", "calendar", "routines", "overdue"] as const).map((target) => (
          <button
            key={target}
            type="button"
            className={`${chipClass(target)} ${chipActive(target)} ${commandDeckVisuals ? "border border-transparent" : ""}`}
            style={
              !commandDeckVisuals && view === target
                ? { background: "rgba(var(--mode-rgb),0.2)", color: "rgba(var(--mode-rgb),0.95)" }
                : undefined
            }
            onClick={() => setView(target)}
          >
            {target === "today" ? "Today" : target === "calendar" ? "Calendar" : target === "routines" ? "Routines" : "Overdue"}
          </button>
        ))}
      </div>
    </div>
  );
}

