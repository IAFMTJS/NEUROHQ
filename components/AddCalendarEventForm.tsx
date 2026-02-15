"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { addManualEvent } from "@/app/actions/calendar";

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AddCalendarEventForm({ date, hasGoogleToken = false }: { date: string; hasGoogleToken?: boolean }) {
  const router = useRouter();
  const minDateTime = `${date}T00:00`;

  const [title, setTitle] = useState("");
  const [start, setStart] = useState(`${date}T09:00`);
  const [end, setEnd] = useState(`${date}T10:00`);
  const [isSocial, setIsSocial] = useState(false);
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const startDate = new Date(start);
    const startAt = startDate.toISOString();
    const endAt = new Date(end).toISOString();
    if (!title.trim() || endAt <= startAt) {
      setError("Please enter a title and ensure end is after start.");
      return;
    }
    startTransition(async () => {
      try {
        await addManualEvent({
          title: title.trim(),
          start_at: startAt,
          end_at: endAt,
          is_social: isSocial,
          sync_to_google: hasGoogleToken && syncToGoogle,
        });
        const dayLabel = startDate.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
        setSuccess(`Event saved for ${dayLabel}. It appears under that day above.`);
        setTitle("");
        setStart(`${date}T09:00`);
        setEnd(`${date}T10:00`);
        router.refresh();
        setTimeout(() => setSuccess(null), 5000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save event.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      {error && (
        <p className="w-full text-sm text-[#f87171]" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="w-full text-sm text-emerald-500" role="status">
          {success}
        </p>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neuro-muted">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Meeting"
          className="w-40 rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neuro-muted">Start</span>
        <input
          type="datetime-local"
          value={start}
          min={minDateTime}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neuro-muted">End</span>
        <input
          type="datetime-local"
          value={end}
          min={minDateTime}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
        />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isSocial} onChange={(e) => setIsSocial(e.target.checked)} className="rounded border-neuro-border text-neuro-blue focus:ring-neuro-blue" />
        <span className="text-sm text-neuro-muted">Social (×1.5 energy)</span>
      </label>
      {hasGoogleToken && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={syncToGoogle} onChange={(e) => setSyncToGoogle(e.target.checked)} className="rounded border-neuro-border text-neuro-blue focus:ring-neuro-blue" />
          <span className="text-sm text-neuro-muted">Sync to Google</span>
        </label>
      )}
      <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
        Add event
      </button>
    </form>
  );
}
