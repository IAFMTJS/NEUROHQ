"use client";

import { useState, type ReactNode } from "react";
import type { LearningState } from "@/app/actions/learning-state";
import type { ProtocolLibraryRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import type { GrowthFocusState } from "@/app/actions/growth-focus";
import type { StrategyPacingHints } from "@/lib/strategy/strategy-pacing-hints";
import { GrowthIntentCard } from "@/components/growth/GrowthIntentCard";
import { GrowthConsistencyCard } from "@/components/growth/GrowthConsistencyCard";
import { GrowthStreamsList } from "@/components/growth/GrowthStreamsList";
import { GrowthReflectionCard } from "@/components/growth/GrowthReflectionCard";
import { MonthlyBookCard } from "@/components/growth/MonthlyBookCard";
import { AddLearningStreamCard } from "@/components/growth/AddLearningStreamCard";
import { GrowthCommandCenter } from "@/components/growth/GrowthCommandCenter";
import { GrowthBottomHubCards } from "@/components/growth/GrowthBottomHubCards";
import { GrowthProtocolViewerModal } from "@/components/growth/GrowthProtocolViewerModal";
import { GrowthTabsShell } from "@/components/growth/GrowthTabsShell";
import { CollapsibleDashboardCard } from "@/components/dashboard/CollapsibleDashboardCard";
import { weeklyDifficultyFromBrain } from "@/lib/growth/adaptive-engine";
import { progressKey } from "@/lib/growth/resolve-focus-protocol";
import { useHQStore } from "@/lib/hq-store";

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
  /** Read-only Strategy kwartaal-hint; wordt in de protocolkaart getoond. */
  strategyPacingHints: StrategyPacingHints | null;
  simplified?: boolean;
  /** Full layout: content between tabs and panels (mascot, pace hint from server page). */
  heroSlot?: ReactNode;
};

export function LearningContentClient({
  todayStr,
  fallback,
  xpIdentity,
  protocols,
  progressMap,
  growthFocus,
  strategyPacingHints,
  simplified = false,
  heroSlot,
}: Props) {
  const [viewerProtocol, setViewerProtocol] = useState<ProtocolLibraryRow | null>(null);
  const learning: LearningState = fallback;
  const gameState = useHQStore((s) => s.gameState);

  const energyAvg = gameState?.stats.energy ?? null;
  const focusAvg = gameState?.stats.focus ?? null;
  const brainLogged = energyAvg != null && focusAvg != null;
  const { tier: engineTier } = weeklyDifficultyFromBrain({
    energyAvg,
    focusAvg,
    brainLogged,
  });

  const currentBook = learning.streams.find((s) => s.type === "book") ?? null;

  return (
    <div className="space-y-4 sm:space-y-6" data-tutorial="growth-content">
      <GrowthTabsShell belowTabsSlot={!simplified ? heroSlot : undefined}>
        {(activeTab) => (
          <>
            {activeTab === "command" && (
              <div className="space-y-6">
                <GrowthCommandCenter
                  protocols={protocols}
                  progressMap={progressMap}
                  engineTier={engineTier}
                  growthFocus={growthFocus}
                  strategyPacingHints={strategyPacingHints}
                  onOpenProtocol={setViewerProtocol}
                />
                <GrowthBottomHubCards
                  protocols={protocols}
                  progressMap={progressMap}
                  growthFocus={growthFocus}
                  onOpenProtocol={setViewerProtocol}
                />
              </div>
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

