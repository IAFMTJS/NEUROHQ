"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { updateLearningSession, deleteLearningSession } from "@/app/actions/learning";

function useTransitionOnce() {
  const [isPending, startTransition] = useTransition();
  return { pending: isPending, startTransition };
}

const LEARNING_TYPE_LABELS: Record<string, string> = { general: "General", reading: "Reading", course: "Course", podcast: "Podcast", video: "Video" };
type Session = { id: string; date: string; minutes: number; topic: string | null; learning_type?: string | null };

type Props = { sessions: Session[]; weekEnd: string; weekStart: string };

export function LearningRecentSessions({ sessions, weekEnd, weekStart }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Sessions this week</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Recent learning sessions (Mon – {weekEnd}). Edit or delete to correct.</p>
      </div>
      <div className="p-4">
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">No sessions logged this week.</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Log tijd hierboven om je wekelijkse target te halen. Elke week dat je je target haalt, bouwt je streak.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/50 px-3 py-2.5"
              >
                {editingId === s.id ? (
                  <LearningSessionEditForm
                    session={s}
                    weekStart={weekStart}
                    weekEnd={weekEnd}
                    onClose={() => setEditingId(null)}
                    onSave={() => { setEditingId(null); router.refresh(); }}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {s.minutes} min{s.minutes !== 1 ? "s" : ""}
                      {s.learning_type && s.learning_type !== "general" ? ` · ${LEARNING_TYPE_LABELS[s.learning_type] ?? s.learning_type}` : ""}
                      {s.topic ? ` · ${s.topic}` : ""}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">
                        {format(new Date(s.date), "EEE d MMM")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingId(s.id)}
                        className="text-xs text-[var(--accent-focus)] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this session?")) {
                            startTransition(async () => {
                              await deleteLearningSession(s.id);
                              router.refresh();
                            });
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
  const [learningType, setLearningType] = useState<"general" | "reading" | "course" | "podcast" | "video">((session.learning_type as "general" | "reading" | "course" | "podcast" | "video") ?? "general");
  const { pending, startTransition } = useTransitionOnce();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const m = parseInt(minutes, 10);
    if (isNaN(m) || m <= 0) return;
    const start = new Date(weekStart).getTime();
    const end = new Date(weekEnd).getTime();
    const d = new Date(date).getTime();
    if (d < start || d > end) {
      if (!confirm("Deze datum valt buiten deze week. Toch opslaan?")) return;
    }
    startTransition(async () => {
      await updateLearningSession(session.id, { minutes: m, date, topic: topic || null, learning_type: learningType });
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
          className="w-16 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
        />
        <span className="flex items-center text-sm text-[var(--text-muted)]">min</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
        />
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic"
          className="min-w-[100px] flex-1 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
        />
        <select
          value={learningType}
          onChange={(e) => setLearningType(e.target.value as typeof learningType)}
          className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
        >
          {(["general", "reading", "course", "podcast", "video"] as const).map((t) => (
            <option key={t} value={t}>{LEARNING_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary rounded px-2 py-1 text-xs font-medium disabled:opacity-50">
          Save
        </button>
        <button type="button" onClick={onClose} className="btn-secondary rounded px-2 py-1 text-xs font-medium">
          Cancel
        </button>
      </div>
    </form>
  );
}
