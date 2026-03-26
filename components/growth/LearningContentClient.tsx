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
import { GrowthProtocolLibrary } from "@/components/growth/GrowthProtocolLibrary";
import { GrowthCommandCenter } from "@/components/growth/GrowthCommandCenter";
import { GrowthProtocolViewerModal } from "@/components/growth/GrowthProtocolViewerModal";
import { GrowthSystemLoop } from "@/components/growth/GrowthSystemLoop";
import { GrowthTabsShell } from "@/components/growth/GrowthTabsShell";
import { CollapsibleDashboardCard } from "@/components/dashboard/CollapsibleDashboardCard";
import { weeklyDifficultyFromBrain } from "@/lib/growth/adaptive-engine";
import { progressKey } from "@/lib/growth/resolve-focus-protocol";
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
      <GrowthTabsShell>
        {(activeTab) => (
          <>
            {activeTab === "command" && (
              <GrowthCommandCenter
                protocols={protocols}
                progressMap={progressMap}
                engineTier={engineTier}
                growthFocus={growthFocus}
                onOpenProtocol={setViewerProtocol}
              />
            )}

            {activeTab === "path" && (
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
          <CollapsibleDashboardCard
            title="Weekreflectie"
            subtitle="Kort evalueren wat werkte — optioneel, maar helpt bij sturing."
            storageKey="growth-reflection"
            defaultExpanded={learning.reflection.reflectionRequired}
            dataTutorial="growth-reflection"
          >
            <div className="px-4 pb-4 pt-0 md:px-5">
              <GrowthReflectionCard
                reflection={learning.reflection}
                today={todayStr}
                embedded
              />
            </div>
          </CollapsibleDashboardCard>
        </div>
        <div className="space-y-6 xl:col-span-5">
          <CollapsibleDashboardCard
            title="Maandboek"
            subtitle={currentBook?.title ? currentBook.title : "Geen boek gekozen — open om te starten."}
            storageKey="growth-monthly-book"
            defaultExpanded={!currentBook?.title}
            dataTutorial="growth-monthly-book"
          >
            <div className="px-4 pb-4 pt-0 md:px-5">
              <MonthlyBookCard
                currentBookTitle={currentBook?.title ?? null}
                totalPages={currentBook?.pagesTotal ?? null}
                embedded
              />
            </div>
          </CollapsibleDashboardCard>
          <AddLearningStreamCard />
        </div>
              </div>
            )}

            {activeTab === "streams" && (
              <div id="growth-streams" className="scroll-mt-28">
                <GrowthStreamsList streams={learning.streams} />
              </div>
            )}
          </>
        )}
      </GrowthTabsShell>

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

