"use client";

import { useState, useTransition } from "react";
import { addManualEvent } from "@/app/actions/calendar";

export function AddCalendarEventForm({ date, hasGoogleToken = false }: { date: string; hasGoogleToken?: boolean }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(`${date}T09:00`);
  const [end, setEnd] = useState(`${date}T10:00`);
  const [isSocial, setIsSocial] = useState(false);
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const startAt = new Date(start).toISOString();
    const endAt = new Date(end).toISOString();
    if (!title.trim() || endAt <= startAt) return;
    startTransition(async () => {
      await addManualEvent({
        title: title.trim(),
        start_at: startAt,
        end_at: endAt,
        is_social: isSocial,
        sync_to_google: hasGoogleToken && syncToGoogle,
      });
      setTitle("");
      setStart(`${date}T09:00`);
      setEnd(`${date}T10:00`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card-modern flex flex-wrap items-end gap-2 p-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Meeting"
          className="w-40 rounded border border-neutral-600 bg-neuro-dark px-2 py-1.5 text-sm text-white"
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Start</span>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded border border-neutral-600 bg-neuro-dark px-2 py-1.5 text-sm text-white"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">End</span>
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded border border-neutral-600 bg-neuro-dark px-2 py-1.5 text-sm text-white"
        />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isSocial} onChange={(e) => setIsSocial(e.target.checked)} />
        <span className="text-sm text-neutral-400">Social (×1.5 energy)</span>
      </label>
      {hasGoogleToken && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={syncToGoogle} onChange={(e) => setSyncToGoogle(e.target.checked)} />
          <span className="text-sm text-neutral-400">Sync to Google Calendar</span>
        </label>
      )}
      <button type="submit" disabled={pending} className="rounded bg-neuro-blue px-3 py-1.5 text-sm text-white">
        Add event
      </button>
    </form>
  );
}
