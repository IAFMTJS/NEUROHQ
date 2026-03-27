"use client";

import { useEffect, useMemo, useState } from "react";
import { useHQStore } from "@/lib/hq-store";
import { CalendarViewShell } from "@/components/missions/CalendarViewShell";
import { AddCalendarEventForm } from "@/components/AddCalendarEventForm";
import { AgendaOnlyList } from "@/components/AgendaOnlyList";
import { CalendarModal3Trigger } from "@/components/missions";

function toDateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function toMonthKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 7);
}

type CalendarEvent = {
  id: string;
  title: string | null;
  start_at: string;
  end_at: string;
  is_social: boolean;
  source: string | null;
};

type Props = {
  initialMonth: string;
  initialDay: string;
  dateStr: string;
  tasksByDate: Record<string, unknown[]>;
  upcomingCalendarEvents: CalendarEvent[];
  hasGoogle: boolean;
  initialCalView: "today" | "calendar" | "routines" | "overdue";
  overdueTasks: { id: string; title: string | null; due_date: string | null }[];
  /** Tasks page simplified mode: compact chrome, scrolls inside parent card. */
  simplifiedLayout?: boolean;
};

export function TasksCalendarSection({
  initialMonth,
  initialDay,
  dateStr,
  tasksByDate,
  upcomingCalendarEvents,
  hasGoogle,
  initialCalView,
  overdueTasks,
  simplifiedLayout = false,
}: Props) {
  const [monthParam, setMonthParam] = useState(() => initialMonth);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(() => initialDay);

  const storeTasksByDate = useHQStore((s) => s.tasksByDate);
  const effectiveTasksByDate = useMemo(() => {
    const merged = { ...tasksByDate } as Record<string, unknown[]>;
    for (const [date, storeTasks] of Object.entries(storeTasksByDate)) {
      if (storeTasks && storeTasks.length >= 0) {
        merged[date] = storeTasks as unknown[];
      }
    }
    return merged;
  }, [tasksByDate, storeTasksByDate]);

  const [monthYear, monthNumber] = monthParam.split("-").map((p) => parseInt(p, 10));
  const monthStart = new Date(Date.UTC(monthYear, monthNumber - 1, 1, 12));
  const monthEnd = new Date(Date.UTC(monthYear, monthNumber, 0, 12));
  const prevMonthDate = new Date(Date.UTC(monthYear, monthNumber - 2, 1, 12));
  const nextMonthDate = new Date(Date.UTC(monthYear, monthNumber, 1, 12));
  const monthLabel = monthStart.toLocaleDateString("nl-NL", { month: "long", year: "numeric", timeZone: "UTC" });

  const weekStartOffset = monthStart.getUTCDay();
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(monthStart.getUTCDate() - weekStartOffset);
  const gridEnd = new Date(monthEnd);
  const weekEndOffset = 6 - monthEnd.getUTCDay();
  gridEnd.setUTCDate(monthEnd.getUTCDate() + weekEndOffset);

  const eventCountByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of upcomingCalendarEvents) {
      const key = e.start_at.slice(0, 10);
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [upcomingCalendarEvents]);

  const calendarDays = useMemo(() => {
    const days: { dateKey: string; inCurrentMonth: boolean; isToday: boolean; isSelected: boolean; eventCount: number }[] =
      [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const dateKey = toDateKeyUTC(cursor);
      days.push({
        dateKey,
        inCurrentMonth: toMonthKeyUTC(cursor) === monthParam,
        isToday: dateKey === dateStr,
        isSelected: dateKey === selectedCalendarDay,
        eventCount: eventCountByDay.get(dateKey) ?? 0,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return days;
  }, [gridStart, gridEnd, monthParam, selectedCalendarDay, dateStr, eventCountByDay]);

  const selectedDayTasks = (effectiveTasksByDate[selectedCalendarDay] ?? []) as {
    id: string;
    title: string | null;
    completed?: boolean;
    recurrence_rule?: string | null;
  }[];
  const selectedDayRoutines = selectedDayTasks.filter((t) => t.recurrence_rule);
  const selectedDayEvents = upcomingCalendarEvents.filter(
    (e) => e.start_at.slice(0, 10) === selectedCalendarDay
  );
  const selectedDayLabel = new Date(`${selectedCalendarDay}T12:00:00Z`).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const contentPad = simplifiedLayout ? "p-3 space-y-4" : "p-4 space-y-5";

  return (
    <section className="overflow-hidden p-0" id="agenda">
      {!simplifiedLayout && (
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Calendar · Agenda overview</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Klik op een dag in het maandoverzicht om events en missies voor die datum te zien.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CalendarModal3Trigger date={dateStr} />
            <span className="text-[11px] text-[var(--text-muted)]">Open de strategische weekplanner voor extra detail.</span>
          </div>
        </div>
      )}
      {simplifiedLayout && (
        <div className="shrink-0 border-b border-[var(--card-border)]/40 px-3 py-2">
          <CalendarModal3Trigger date={dateStr} />
        </div>
      )}
      <div className={contentPad}>
        <div
          className="rounded-2xl border p-3"
          style={{
            borderColor: "rgba(var(--mode-rgb),0.25)",
            background:
              "linear-gradient(180deg, rgba(var(--mode-rgb-deep),0.36), rgba(var(--mode-rgb),0.16))",
            boxShadow: "0 0 18px rgba(var(--mode-rgb),0.12)",
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setMonthParam(toMonthKeyUTC(prevMonthDate));
              }}
              className="rounded-full border px-2.5 py-1 text-xs hover:text-[var(--mode-text-strong,#fff)]"
              style={{
                borderColor: "rgba(var(--mode-rgb),0.25)",
                background: "rgba(var(--mode-rgb-deep),0.35)",
                color: "rgba(var(--mode-rgb),0.8)",
              }}
            >
              ←
            </button>
            <p className="text-sm font-semibold capitalize" style={{ color: "rgba(var(--mode-rgb),0.95)" }}>
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={() => {
                setMonthParam(toMonthKeyUTC(nextMonthDate));
              }}
              className="rounded-full border px-2.5 py-1 text-xs hover:text-[var(--mode-text-strong,#fff)]"
              style={{
                borderColor: "rgba(var(--mode-rgb),0.25)",
                background: "rgba(var(--mode-rgb-deep),0.35)",
                color: "rgba(var(--mode-rgb),0.8)",
              }}
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(var(--mode-rgb),0.65)" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => {
                  setSelectedCalendarDay(day.dateKey);
                }}
                className={`relative min-h-[52px] rounded-md border px-1.5 py-1 text-left text-xs transition ${
                  day.isSelected
                    ? "text-[var(--mode-text-strong,#fff)]"
                    : day.inCurrentMonth
                      ? "hover:border-[rgba(var(--mode-rgb),0.4)]"
                      : ""
                }`}
                style={{
                  borderColor: day.isSelected
                    ? "rgba(var(--mode-rgb),0.7)"
                    : day.inCurrentMonth
                      ? "rgba(var(--mode-rgb),0.2)"
                      : "transparent",
                  background: day.isSelected
                    ? "rgba(var(--mode-rgb),0.15)"
                    : day.inCurrentMonth
                      ? "rgba(var(--mode-rgb-deep),0.22)"
                      : "rgba(var(--mode-rgb-deep),0.08)",
                  color: day.isSelected
                    ? "rgba(var(--mode-rgb),0.95)"
                    : day.inCurrentMonth
                      ? "rgba(var(--mode-rgb),0.9)"
                      : "rgba(var(--mode-rgb),0.35)",
                  boxShadow: day.isSelected ? "0 0 12px rgba(var(--mode-rgb),0.2)" : undefined,
                }}
              >
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                  style={
                    day.isToday
                      ? {
                          background: "rgba(var(--mode-rgb),0.25)",
                          color: "rgba(var(--mode-rgb),0.95)",
                        }
                      : undefined
                  }
                >
                  {day.dateKey.slice(8, 10)}
                </span>
                {day.eventCount > 0 && (
                  <span
                    className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                    style={{
                      background: day.eventCount >= 2 ? "rgb(252 211 77)" : "rgba(var(--mode-rgb),0.8)",
                      boxShadow: "0 0 8px rgba(var(--mode-rgb),0.8)",
                    }}
                    aria-label={`${day.eventCount} agenda item${day.eventCount === 1 ? "" : "s"}`}
                  >
                    <span className="sr-only">{day.eventCount}</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <CalendarViewShell
          initialView={initialCalView}
          selectedDayLabel={selectedDayLabel}
          selectedDayEvents={selectedDayEvents}
          selectedDayTasks={selectedDayTasks}
          selectedDayRoutines={selectedDayRoutines}
          overdueTasks={overdueTasks}
        />

        <AddCalendarEventForm date={selectedCalendarDay} hasGoogleToken={hasGoogle} allowAnyDate />
        <AgendaOnlyList upcomingEvents={upcomingCalendarEvents} todayStr={dateStr} />
      </div>
    </section>
  );
}
