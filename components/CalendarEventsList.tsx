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

export function CalendarEventsList({ events }: { events: Event[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    startTransition(() => deleteCalendarEvent(id).then(() => router.refresh()));
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-4 py-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">Geen afspraken vandaag.</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Voeg hieronder een toe of koppel je agenda.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {events.map((e) => (
        <li key={e.id} className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/50 px-3 py-2.5">
          <div>
            <span className="text-sm font-medium text-[var(--text-primary)]">{e.title ?? "Untitled"}</span>
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
