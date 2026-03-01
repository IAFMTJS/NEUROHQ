"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addManualEvent } from "@/app/actions/calendar";

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AddCalendarEventForm({ date, hasGoogleToken = false, allowAnyDate = false }: { date: string; hasGoogleToken?: boolean; allowAnyDate?: boolean }) {
  const router = useRouter();
  const minDateTime = allowAnyDate ? "2020-01-01T00:00" : `${date}T00:00`;

  const [eventDate, setEventDate] = useState(date);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(`${eventDate}T09:00`);
  const [end, setEnd] = useState(`${eventDate}T10:00`);
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
        const dayLabel = startDate.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
        setSuccess(`Agenda-item opgeslagen voor ${dayLabel}.`);
        setTitle("");
        setEventDate(date);
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
      {allowAnyDate && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-muted)]">Datum</span>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => {
              const d = e.target.value;
              setEventDate(d);
              setStart(`${d}T09:00`);
              setEnd(`${d}T10:00`);
            }}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
          />
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--text-muted)]">Titel</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="bijv. Vergadering"
          className="w-40 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--text-muted)]">Start</span>
        <input
          type="datetime-local"
          value={start}
          min={minDateTime}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--text-muted)]">End</span>
        <input
          type="datetime-local"
          value={end}
          min={minDateTime}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
        />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isSocial} onChange={(e) => setIsSocial(e.target.checked)} className="rounded border-[var(--card-border)] text-[var(--accent-focus)] focus:ring-[var(--accent-focus)]" />
        <span className="text-sm text-[var(--text-muted)]">Social (×1.5 energy)</span>
      </label>
      {hasGoogleToken && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={syncToGoogle} onChange={(e) => setSyncToGoogle(e.target.checked)} className="rounded border-[var(--card-border)] text-[var(--accent-focus)] focus:ring-[var(--accent-focus)]" />
          <span className="text-sm text-[var(--text-muted)]">Sync to Google</span>
        </label>
      )}
      <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
        Add event
      </button>
    </form>
  );
}
