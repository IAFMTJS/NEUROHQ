"use client";

import { useState, useMemo } from "react";
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
}: Props) {
  const [monthParam, setMonthParam] = useState(initialMonth);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(initialDay);

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
    const days: { dateKey: string; inCurrentMonth: boolean; isToday: boolean; isSelected: boolean; eventCount: number }[] = [];
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

  const selectedDayTasks = (tasksByDate[selectedCalendarDay] ?? []) as { id: string; title: string | null; completed?: boolean; recurrence_rule?: string | null }[];
  const selectedDayRoutines = selectedDayTasks.filter((t) => t.recurrence_rule);
  const selectedDayEvents = upcomingCalendarEvents.filter((e) => e.start_at.slice(0, 10) === selectedCalendarDay);
  const selectedDayLabel = new Date(`${selectedCalendarDay}T12:00:00Z`).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <section className="overflow-hidden p-0" id="agenda">
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
      <div className="p-4 space-y-5">
        <div className="rounded-2xl border border-cyan-400/25 bg-[linear-gradient(180deg,rgba(8,23,42,0.9),rgba(5,15,30,0.92))] p-3 shadow-[0_0_18px_rgba(0,170,255,0.12)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMonthParam(toMonthKeyUTC(prevMonthDate))}
              className="rounded-full border border-cyan-400/25 bg-[rgba(6,18,31,0.7)] px-2.5 py-1 text-xs text-cyan-100/80 hover:text-cyan-100"
            >
              ←
            </button>
            <p className="text-sm font-semibold capitalize text-cyan-50">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setMonthParam(toMonthKeyUTC(nextMonthDate))}
              className="rounded-full border border-cyan-400/25 bg-[rgba(6,18,31,0.7)] px-2.5 py-1 text-xs text-cyan-100/80 hover:text-cyan-100"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-cyan-100/65">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedCalendarDay(day.dateKey)}
                className={`relative min-h-[52px] rounded-md border px-1.5 py-1 text-left text-xs transition ${
                  day.isSelected
                    ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    : day.inCurrentMonth
                      ? "border-cyan-500/20 bg-[rgba(8,20,35,0.55)] text-cyan-100/90 hover:border-cyan-400/40"
                      : "border-transparent bg-[rgba(8,20,35,0.2)] text-cyan-100/35"
                }`}
              >
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${day.isToday ? "bg-cyan-500/25 text-cyan-100" : ""}`}>
                  {day.dateKey.slice(8, 10)}
                </span>
                {day.eventCount > 0 && (
                  <span
                    className={`absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${day.eventCount >= 2 ? "bg-amber-300" : "bg-cyan-300"} shadow-[0_0_8px_rgba(56,189,248,0.8)]`}
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
