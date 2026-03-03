"use client";

import type { FC } from "react";
import { useState, useTransition } from "react";
import type { LearningStream } from "@/app/actions/learning-state";
import { addLearningSession, setMonthlyBookPagesRead } from "@/app/actions/learning";

type Props = {
  streams: LearningStream[];
};

export const GrowthStreamsList: FC<Props> = ({ streams }) => {
  const [pendingId, startTransition] = useTransition();
  const [pagesInput, setPagesInput] = useState<Record<string, string>>({});

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
    });
  }

  if (streams.length === 0) {
    return (
      <section className="card-simple">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Learning streams</h2>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          Define your primary learning focus.
        </p>
      </section>
    );
  }

  return (
    <section className="card-simple">
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
              <button
                type="button"
                onClick={() => handleStartSession(stream)}
                disabled={!!pendingId}
                className="shrink-0 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)] disabled:opacity-50"
              >
                {pendingId ? "Starting…" : "Start session"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

