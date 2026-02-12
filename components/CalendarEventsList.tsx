"use client";

import { useTransition } from "react";
import { deleteCalendarEvent } from "@/app/actions/calendar";

type Event = {
  id: string;
  title: string | null;
  start_at: string;
  end_at: string;
  is_social: boolean;
  source: string | null;
};

export function CalendarEventsList({ events }: { events: Event[] }) {
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    startTransition(() => deleteCalendarEvent(id));
  }

  if (events.length === 0) return <p className="text-sm text-neutral-500">No events today.</p>;
  return (
    <ul className="space-y-2">
      {events.map((e) => (
        <li key={e.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <div>
            <span className="text-sm font-medium text-neuro-silver">{e.title ?? "Untitled"}</span>
            <span className="ml-2 text-xs text-neutral-400">
              {new Date(e.start_at).toLocaleTimeString()} – {new Date(e.end_at).toLocaleTimeString()}
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
  );
}
