"use client";

import { useState } from "react";
import type { LearningState } from "@/app/actions/learning-state";
import type { ProtocolLibraryRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import type { GrowthFocusState } from "@/app/actions/growth-focus";
import { GrowthIntentCard } from "@/components/growth/GrowthIntentCard";
import { GrowthConsistencyCard } from "@/components/growth/GrowthConsistencyCard";
import { GrowthStreamsList } from "@/components/growth/GrowthStreamsList";
import { GrowthReflectionCard } from "@/components/growth/GrowthReflectionCard";
import { MonthlyBookCard } from "@/components/growth/MonthlyBookCard";
import { AddLearningStreamCard } from "@/components/growth/AddLearningStreamCard";
import { UserGoalMissionGeneratorCard } from "@/components/growth/UserGoalMissionGeneratorCard";
import { GrowthAdaptiveHint } from "@/components/growth/GrowthAdaptiveHint";
import { GrowthSectionNav } from "@/components/growth/GrowthSectionNav";
import { GrowthProtocolLibrary } from "@/components/growth/GrowthProtocolLibrary";
import { GrowthCommandCenter } from "@/components/growth/GrowthCommandCenter";
import { GrowthProtocolViewerModal } from "@/components/growth/GrowthProtocolViewerModal";
import { GrowthSystemLoop } from "@/components/growth/GrowthSystemLoop";
import { weeklyDifficultyFromBrain } from "@/lib/growth/adaptive-engine";
import { useHQStore } from "@/lib/hq-store";
import { XPBadge } from "@/components/XPBadge";
import Link from "next/link";

type XPIdentityPayload = {
  total_xp: number;
  level: number;
  streak: { current: number; longest: number; last_completion_date: string | null };
};

type Props = {
  todayStr: string;
  fallback: LearningState;
  /** Server XP/streak so hero stats render before DCIC store hydrates. */
  xpIdentity: XPIdentityPayload;
  /** Protocol trajectories from `protocol_library` (D.3). */
  protocols: ProtocolLibraryRow[];
  /** Per-protocol voortgang (tiers, week, afgevinkte taken). */
  progressMap: Record<string, ProtocolProgressState>;
  /** Opgeslagen focus-protocol (user_preferences). */
  growthFocus: GrowthFocusState;
};

function progressKey(slug: string, locale: string) {
  return `${slug}::${locale}`;
}

export function LearningContentClient({
  todayStr,
  fallback,
  xpIdentity,
  protocols,
  progressMap,
  growthFocus,
}: Props) {
  const [viewerProtocol, setViewerProtocol] = useState<ProtocolLibraryRow | null>(null);
  const learning: LearningState = fallback;
  const gameState = useHQStore((s) => s.gameState);

  const level = gameState?.level ?? xpIdentity.level;
  const totalXp = xpIdentity.total_xp;
  const streak = gameState?.streak.current ?? xpIdentity.streak.current;
  const mode = gameState?.mode?.current ?? "focus";
  const energyAvg = gameState?.stats.energy ?? null;
  const focusAvg = gameState?.stats.focus ?? null;
  const brainLogged = energyAvg != null && focusAvg != null;
  const { tier: engineTier } = weeklyDifficultyFromBrain({
    energyAvg,
    focusAvg,
    brainLogged,
  });

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
      <GrowthSectionNav />

      <GrowthCommandCenter
        protocols={protocols}
        progressMap={progressMap}
        engineTier={engineTier}
        growthFocus={growthFocus}
        onOpenProtocol={setViewerProtocol}
      />

      <GrowthSystemLoop />

      <GrowthProtocolLibrary
        protocols={protocols}
        progressMap={progressMap}
        viewerProtocol={viewerProtocol}
        onViewerProtocolChange={setViewerProtocol}
      />

      <section
        id="growth-overview"
        className="scroll-mt-28 card-simple overflow-hidden p-0 ring-1 ring-[var(--semantic-ring)]/20"
      >
        <div className="border-b border-[var(--card-border)] bg-[var(--bg-elevated)]/40 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--semantic-accent)]">
            Growth dashboard
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Streams, sessies, consistentie en engine — naast je gekozen protocol hierboven.
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-soft)] px-3 py-2.5 shadow-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              <span aria-hidden className="text-sm">
                📚
              </span>
              Streams
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
              {activeStreams}/{streamsCount}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">active this week</p>
          </div>
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-soft)] px-3 py-2.5 shadow-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              <span aria-hidden className="text-sm">
                ⏱
              </span>
              Weekly sessions
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{sessionsThisWeek}</p>
            <p className="text-[11px] text-[var(--text-muted)]">across all streams</p>
          </div>
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-soft)] px-3 py-2.5 shadow-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              <span aria-hidden className="text-sm">
                ✓
              </span>
              Consistency
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{consistencyStatus}</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {learning.consistency.sessionsThisWeek}/{learning.consistency.weeklyTargetSessions} sessions
            </p>
          </div>
          <div className="rounded-lg border border-[var(--card-border)] bg-gradient-to-br from-[var(--bg-soft)] to-[var(--semantic-accent)]/8 px-3 py-2.5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  <span aria-hidden className="text-sm">
                    ⚡
                  </span>
                  Core engine
                </p>
                <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                  L{level} · {streak}d
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {mode === "war" ? "WAR" : mode === "recovery" ? "RECOVERY" : "FOCUS"} mode
                </p>
              </div>
              <XPBadge totalXp={totalXp} level={level} compact href="/xp" />
            </div>
          </div>
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
        <div className="border-t border-[var(--card-border)] px-4 py-4">
          <GrowthAdaptiveHint energyAvg={energyAvg} focusAvg={focusAvg} brainLogged={brainLogged} />
        </div>
      </section>

      <div id="growth-path" className="scroll-mt-28 grid gap-6 xl:grid-cols-12">
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

      <div id="growth-missions" className="scroll-mt-28">
        <UserGoalMissionGeneratorCard />
      </div>
      <div id="growth-streams" className="scroll-mt-28">
        <GrowthStreamsList streams={learning.streams} />
      </div>

      {viewerProtocol && (
        <GrowthProtocolViewerModal
          protocol={viewerProtocol}
          progress={progressMap[progressKey(viewerProtocol.slug, viewerProtocol.locale)] ?? null}
          engineTier={engineTier}
          onClose={() => setViewerProtocol(null)}
        />
      )}
    </div>
  );
}

