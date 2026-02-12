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
  const d = new Date(dateKey);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  if (dateKey === tomorrowStr) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function UpcomingCalendarList({
  upcomingEvents,
  todayStr,
  maxDays = 7,
}: {
  upcomingEvents: Event[];
  todayStr: string;
  /** Number of days to show (e.g. 2 for today + tomorrow on homepage). */
  maxDays?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const byDay = new Map<string, Event[]>();
  for (const e of upcomingEvents) {
    const key = e.start_at.slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }

  const days: string[] = [];
  const start = new Date(todayStr);
  for (let i = 0; i < maxDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    startTransition(() => {
      deleteCalendarEvent(id).then(() => router.refresh());
    });
  }

  return (
    <div className="space-y-4">
      {days.map((dateKey) => {
        const events = byDay.get(dateKey) ?? [];
        const label = dayLabel(dateKey, todayStr);
        return (
          <div key={dateKey}>
            <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neuro-muted">
              {label}
            </h3>
            {events.length === 0 ? (
              <p className="text-sm text-neuro-muted">No events</p>
            ) : (
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
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
