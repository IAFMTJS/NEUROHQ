"use client";

import type { FC } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LearningStream } from "@/app/actions/learning-state";
import {
  addLearningSession,
  setMonthlyBookPagesRead,
  deleteEducationOption,
  deleteMonthlyBook,
  updateEducationOption,
  updateMonthlyBookTitle,
} from "@/app/actions/learning";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { Modal } from "@/components/Modal";

type Props = {
  streams: LearningStream[];
};

export const GrowthStreamsList: FC<Props> = ({ streams }) => {
  const router = useRouter();
  const [pendingId, startTransition] = useTransition();
  const [pagesInput, setPagesInput] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<LearningStream | null>(null);
  const [editTarget, setEditTarget] = useState<LearningStream | null>(null);
  const [editTitle, setEditTitle] = useState("");

  async function handleStartSession(stream: LearningStream) {
    const today = new Date().toISOString().slice(0, 10);
    startTransition(async () => {
      const minutes = 25;
      if (stream.type === "book") {
        await addLearningSession({
          minutes,
          date: today,
          topic: stream.title,
          learning_type: "reading",
          monthly_book_id: stream.id,
        } as any);
      } else {
        await addLearningSession({
          minutes,
          date: today,
          topic: stream.title,
          education_option_id: stream.id,
          learning_type: "course",
        } as any);
      }
      router.refresh();
    });
  }

  if (streams.length === 0) {
    return (
      <section className="card-simple overflow-hidden border border-dashed border-[var(--semantic-ring)]/35 bg-[var(--bg-elevated)]/25 p-0">
        <div className="border-b border-[var(--card-border)]/80 px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Learning streams</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Nothing deployed yet — add a skill or book to see momentum here.</p>
        </div>
        <div className="space-y-3 px-4 py-5">
          <p className="text-sm text-[var(--text-secondary)]">
            Streams power the stats above and the 25-minute session button. Start with one focus you can defend for a week.
          </p>
          <a
            href="#add-learning-stream"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--semantic-accent)]/20 px-4 py-2.5 text-sm font-semibold text-[var(--semantic-accent)] ring-1 ring-[var(--semantic-ring)]/50 hover:bg-[var(--semantic-accent)]/30"
          >
            Add your first stream →
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="card-simple">
      {editTarget && (
        <Modal open title="Stream hernoemen" onClose={() => setEditTarget(null)}>
          <div className="space-y-3">
            <label className="block text-sm text-[var(--text-muted)]">
              Titel
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </label>
            <button
              type="button"
              className="btn-primary rounded-lg px-4 py-2 text-sm"
              onClick={() => {
                const t = editTitle.trim();
                if (!t) return;
                startTransition(async () => {
                  try {
                    if (editTarget.type === "skill") {
                      await updateEducationOption(editTarget.id, { name: t });
                    } else {
                      await updateMonthlyBookTitle(editTarget.id, t);
                    }
                    neuroToast.success("Stream bijgewerkt.");
                    setEditTarget(null);
                    router.refresh();
                  } catch (e) {
                    neuroToast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
                  }
                });
              }}
            >
              Opslaan
            </button>
          </div>
        </Modal>
      )}
      {deleteTarget && (
        <Modal open title="Stream verwijderen?" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-[var(--text-secondary)]">
            <strong>{deleteTarget.title}</strong> verwijderen? Dit kan niet ongedaan worden.
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm" onClick={() => setDeleteTarget(null)}>
              Annuleren
            </button>
            <button
              type="button"
              className="rounded-lg bg-rose-600/90 px-3 py-2 text-sm font-semibold text-white"
              onClick={() => {
                startTransition(async () => {
                  try {
                    if (deleteTarget.type === "skill") {
                      await deleteEducationOption(deleteTarget.id);
                    } else {
                      await deleteMonthlyBook(deleteTarget.id);
                    }
                    neuroToast.success("Stream verwijderd.");
                    setDeleteTarget(null);
                    router.refresh();
                  } catch (e) {
                    neuroToast.error(e instanceof Error ? e.message : "Verwijderen mislukt.");
                  }
                });
              }}
            >
              Verwijderen
            </button>
          </div>
        </Modal>
      )}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Learning streams</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Active skills and books you are currently growing.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {streams.map((stream) => {
          const progressLabel =
            stream.type === "book" && stream.pagesTotal
              ? `${stream.pagesRead ?? 0}/${stream.pagesTotal} pages`
              : `${stream.sessionsThisWeek} sessions this week`;

          const progressRatio =
            stream.type === "book" && stream.pagesTotal
              ? Math.max(
                  0,
                  Math.min(1, (stream.pagesRead ?? 0) / (stream.pagesTotal || 1)),
                )
              : Math.max(0, Math.min(1, stream.sessionsThisWeek > 0 ? 1 : 0));

          return (
            <div
              key={stream.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-[var(--card-border)] bg-[var(--bg-soft)] px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {stream.title}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  {progressLabel}
                  {stream.lastActive && (
                    <> · Last active {stream.lastActive}</>
                  )}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-primary)]"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>
                {stream.type === "book" && stream.pagesTotal != null && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <label className="flex items-center gap-1">
                      <span>Pages read so far</span>
                      <input
                        type="number"
                        min={0}
                        max={stream.pagesTotal ?? undefined}
                        value={pagesInput[stream.id] ?? (stream.pagesRead ?? 0).toString()}
                        onChange={(e) =>
                          setPagesInput((prev) => ({ ...prev, [stream.id]: e.target.value }))
                        }
                        onBlur={() => {
                          const raw = pagesInput[stream.id];
                          const parsed = raw != null ? parseInt(raw, 10) : stream.pagesRead ?? 0;
                          const clamped =
                            parsed != null && Number.isFinite(parsed) && parsed >= 0
                              ? parsed
                              : stream.pagesRead ?? 0;
                          startTransition(async () => {
                            try {
                              await setMonthlyBookPagesRead(stream.id, clamped);
                              router.refresh();
                            } catch {
                              // ignore; error surface via toast elsewhere if needed
                            }
                          });
                        }}
                        className="w-16 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-1 py-0.5 text-[11px] text-[var(--text-primary)]"
                      />
                    </label>
                    <span>
                      / {stream.pagesTotal} pages
                    </span>
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStartSession(stream)}
                  disabled={!!pendingId}
                  className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)] disabled:opacity-50"
                >
                  {pendingId ? "Deploying…" : "Engage session"}
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-focus)]"
                    onClick={() => {
                      setEditTarget(stream);
                      setEditTitle(stream.title);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-0.5 text-[10px] text-rose-400/90 hover:text-rose-300"
                    onClick={() => setDeleteTarget(stream)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

