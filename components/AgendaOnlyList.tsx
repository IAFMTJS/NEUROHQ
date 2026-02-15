"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCalendarEvent } from "@/app/actions/calendar";

type Event = {
  id: string;
  title: string | null;
  start_at: string;
  end_at: string;
  is_social: boolean;
  source: string | null;
};

function dayLabel(dateKey: string, todayStr: string): string {
  if (dateKey === todayStr) return "Today";
  const today = new Date(todayStr);
  const d = new Date(dateKey + "T12:00:00");
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  if (dateKey === tomorrowStr) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/** Shows only days that have at least one event. No empty-day rows. */
export function AgendaOnlyList({
  upcomingEvents,
  todayStr,
}: {
  upcomingEvents: Event[];
  todayStr: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const byDay = new Map<string, Event[]>();
  for (const e of upcomingEvents) {
    const key = e.start_at.slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }

  const daysWithEvents = Array.from(byDay.keys()).sort();

  function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    startTransition(() => {
      deleteCalendarEvent(id).then(() => router.refresh());
    });
  }

  if (daysWithEvents.length === 0) {
    return (
      <p className="text-sm text-neuro-muted">No agenda items. Add events from the dashboard.</p>
    );
  }

  return (
    <div className="space-y-4">
      {daysWithEvents.map((dateKey) => {
        const events = byDay.get(dateKey) ?? [];
        if (events.length === 0) return null;
        const label = dayLabel(dateKey, todayStr);
        return (
          <div key={dateKey}>
            <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neuro-muted">
              {label}
            </h3>
            <ul className="space-y-2">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-xl border border-neuro-border bg-neuro-dark/50 px-3 py-2.5"
                >
                  <div>
                    <span className="text-sm font-medium text-neuro-silver">
                      {e.title ?? "Untitled"}
                    </span>
                    <span className="ml-2 text-xs text-neutral-400">
                      {new Date(e.start_at).toLocaleTimeString()} –{" "}
                      {new Date(e.end_at).toLocaleTimeString()}
                      {e.is_social && " · Social"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/calendar/event/${e.id}/ics`}
                      download
                      className="text-xs text-neuro-muted hover:text-neuro-silver"
                    >
                      Apple Kalender
                    </a>
                    {e.source === "manual" && (
                      <button
                        type="button"
                        onClick={() => handleDelete(e.id)}
                        disabled={pending}
                        className="text-xs text-neutral-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
