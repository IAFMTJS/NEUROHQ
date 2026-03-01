"use client";

import type { FC } from "react";
import { useState, useTransition } from "react";
import type { LearningStream } from "@/app/actions/learning-state";
import { addLearningSession } from "@/app/actions/learning";

type Props = {
  streams: LearningStream[];
};

export const GrowthStreamsList: FC<Props> = ({ streams }) => {
  const [showAll, setShowAll] = useState(false);
  const [pendingId, startTransition] = useTransition();

  const hasOverwhelm = streams.length > 5;
  const visibleStreams = hasOverwhelm && !showAll ? streams.slice(0, 2) : streams;

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
        {visibleStreams.map((stream) => {
          const progressLabel =
            stream.type === "book" && stream.pagesTotal
              ? `${stream.pagesRead ?? 0}/${stream.pagesTotal} pages`
              : `${stream.sessionsThisWeek} sessions this week`;

          const progressRatio =
            stream.type === "book" && stream.pagesTotal
              ? Math.max(
                  0,
                  Math.min(
                    1,
                    (stream.pagesRead ?? 0) / (stream.pagesTotal || 1),
                  ),
                )
              : Math.max(
                  0,
                  Math.min(1, stream.sessionsThisWeek > 0 ? 1 : 0),
                );

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

      {hasOverwhelm && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-3 text-xs font-medium text-[var(--accent-focus)] hover:underline"
        >
          Show all {streams.length} streams
        </button>
      )}
    </section>
  );
};

