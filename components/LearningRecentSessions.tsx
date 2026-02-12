"use client";

import { useState, useTransition } from "react";
import { updateLearningSession, deleteLearningSession } from "@/app/actions/learning";

function useTransitionOnce() {
  const [isPending, startTransition] = useTransition();
  return { pending: isPending, startTransition };
}

type Session = { id: string; date: string; minutes: number; topic: string | null };

type Props = { sessions: Session[]; weekEnd: string; weekStart: string };

export function LearningRecentSessions({ sessions, weekEnd, weekStart }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <section className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Sessions this week</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">Recent learning sessions (Mon – {weekEnd}). Edit or delete to correct.</p>
      </div>
      <div className="p-4">
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neuro-border bg-neuro-dark/40 px-4 py-6 text-center">
            <p className="text-sm text-neuro-muted">No sessions logged this week.</p>
            <p className="mt-1 text-xs text-neuro-muted">Log one above to get started.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-neuro-border bg-neuro-dark/50 px-3 py-2.5"
              >
                {editingId === s.id ? (
                  <LearningSessionEditForm
                    session={s}
                    weekStart={weekStart}
                    weekEnd={weekEnd}
                    onClose={() => setEditingId(null)}
                    onSave={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-neuro-silver">
                      {s.minutes} min{s.minutes !== 1 ? "s" : ""}
                      {s.topic ? ` · ${s.topic}` : ""}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-neuro-muted">
                        {new Date(s.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingId(s.id)}
                        className="text-xs text-neuro-blue hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this session?")) {
                            startTransition(() => deleteLearningSession(s.id));
                          }
                        }}
                        disabled={pending}
                        className="text-xs text-red-400 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function LearningSessionEditForm({
  session,
  weekStart,
  weekEnd,
  onClose,
  onSave,
}: {
  session: Session;
  weekStart: string;
  weekEnd: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [minutes, setMinutes] = useState(String(session.minutes));
  const [date, setDate] = useState(session.date);
  const [topic, setTopic] = useState(session.topic ?? "");
  const { pending, startTransition } = useTransitionOnce();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const m = parseInt(minutes, 10);
    if (isNaN(m) || m <= 0) return;
    const start = new Date(weekStart).getTime();
    const end = new Date(weekEnd).getTime();
    const d = new Date(date).getTime();
    if (d < start || d > end) {
      if (!confirm("This date is outside the current week. Save anyway?")) return;
    }
    startTransition(async () => {
      await updateLearningSession(session.id, { minutes: m, date, topic: topic || null });
      onSave();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          type="number"
          min="1"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-16 rounded border border-neuro-border bg-neuro-dark px-2 py-1 text-sm text-neuro-silver"
        />
        <span className="flex items-center text-sm text-neuro-muted">min</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-neuro-border bg-neuro-dark px-2 py-1 text-sm text-neuro-silver"
        />
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic"
          className="min-w-[100px] flex-1 rounded border border-neuro-border bg-neuro-dark px-2 py-1 text-sm text-neuro-silver"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary rounded px-2 py-1 text-xs font-medium disabled:opacity-50">
          Save
        </button>
        <button type="button" onClick={onClose} className="rounded border border-neuro-border px-2 py-1 text-xs text-neuro-muted hover:text-neuro-silver">
          Cancel
        </button>
      </div>
    </form>
  );
}
