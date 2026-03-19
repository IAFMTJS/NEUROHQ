"use client";

import type { LearningState } from "@/app/actions/learning-state";
import { GrowthIntentCard } from "@/components/growth/GrowthIntentCard";
import { GrowthConsistencyCard } from "@/components/growth/GrowthConsistencyCard";
import { GrowthStreamsList } from "@/components/growth/GrowthStreamsList";
import { GrowthReflectionCard } from "@/components/growth/GrowthReflectionCard";
import { MonthlyBookCard } from "@/components/growth/MonthlyBookCard";
import { AddLearningStreamCard } from "@/components/growth/AddLearningStreamCard";
import { useHQStore } from "@/lib/hq-store";
import { XPBadge } from "@/components/XPBadge";
import Link from "next/link";

type Props = {
  todayStr: string;
  fallback: LearningState;
};

export function LearningContentClient({ todayStr, fallback }: Props) {
  const learning: LearningState = fallback;
  const gameState = useHQStore((s) => s.gameState);

  const level = gameState?.level ?? null;
  const totalXp = gameState?.currentXP ?? null;
  const streak = gameState?.streak.current ?? null;
  const mode = gameState?.mode?.current ?? "focus";

  const currentBook = learning.streams.find((s) => s.type === "book") ?? null;
  const streamsCount = learning.streams.length;
  const sessionsThisWeek = learning.streams.reduce(
    (sum, stream) => sum + Math.max(0, stream.sessionsThisWeek || 0),
    0,
  );
  const activeStreams = learning.streams.filter(
    (stream) =>
      (stream.sessionsThisWeek ?? 0) > 0 ||
      (stream.type === "book" && (stream.pagesRead ?? 0) > 0),
  ).length;
  const completionRatio = Math.max(0, Math.min(1, learning.consistency.completionRatio));
  const consistencyStatus =
    completionRatio >= 1
      ? "Excellent momentum"
      : completionRatio >= 0.75
        ? "On track"
        : completionRatio >= 0.4
          ? "Needs tightening"
          : "At risk";

  return (
    <div className="space-y-6" data-tutorial="growth-content">
      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Growth mission control
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Intent, consistency, and deliberate sessions in one tactical board.
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-soft)] px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Streams
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
              {activeStreams}/{streamsCount}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">active this week</p>
          </div>
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-soft)] px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Weekly sessions
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{sessionsThisWeek}</p>
            <p className="text-[11px] text-[var(--text-muted)]">across all streams</p>
          </div>
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-soft)] px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Consistency
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{consistencyStatus}</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {learning.consistency.sessionsThisWeek}/{learning.consistency.weeklyTargetSessions} sessions
            </p>
          </div>
          {level != null && totalXp != null ? (
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-soft)] px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    Core engine
                  </p>
                  <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                    L{level} · {streak ?? 0}d
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {mode === "war" ? "WAR" : mode === "recovery" ? "RECOVERY" : "FOCUS"} mode
                  </p>
                </div>
                <XPBadge totalXp={totalXp} level={level} compact href="/xp" />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-soft)] px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Next step
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Add one stream and run a 25-minute session to start momentum.
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--card-border)] px-4 py-3">
          <Link
            href="/learning/analytics"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
          >
            Open analytics
          </Link>
          <Link
            href="/strategy"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
          >
            Tune strategy
          </Link>
          <Link
            href="/xp"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
          >
            View XP
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <GrowthIntentCard
            focus={learning.focus}
            currentBookTitle={currentBook?.title ?? null}
          />
          <GrowthConsistencyCard
            consistency={learning.consistency}
            today={todayStr}
          />
          <GrowthReflectionCard
            reflection={learning.reflection}
            today={todayStr}
          />
        </div>
        <div className="space-y-6 xl:col-span-5">
          <MonthlyBookCard
            currentBookTitle={currentBook?.title ?? null}
            totalPages={currentBook?.pagesTotal ?? null}
          />
          <AddLearningStreamCard />
        </div>
      </div>

      <GrowthStreamsList streams={learning.streams} />
    </div>
  );
}

