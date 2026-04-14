"use client";

import { useState, type ReactNode } from "react";
import type { ProtocolLibraryListRow } from "@/app/actions/protocol-library";
import type { ProtocolProgressState } from "@/app/actions/protocol-progress";
import type { GrowthFocusState } from "@/app/actions/growth-focus";
import type { StrategyPacingHints } from "@/lib/strategy/strategy-pacing-hints";
import { GrowthCommandCenter } from "@/components/growth/GrowthCommandCenter";
import { GrowthProtocolViewerModal } from "@/components/growth/GrowthProtocolViewerModal";
import { weeklyDifficultyFromBrain } from "@/lib/growth/adaptive-engine";
import { progressKey } from "@/lib/growth/resolve-focus-protocol";
import { useHQStore } from "@/lib/hq-store";

type Props = {
  /** Bundled protocol presets from repo JSON; user progress in Supabase. */
  protocols: ProtocolLibraryListRow[];
  /** Per-protocol voortgang (tiers, week, afgevinkte taken). */
  progressMap: Record<string, ProtocolProgressState>;
  /** Opgeslagen focus-protocol (user_preferences). */
  growthFocus: GrowthFocusState;
  /** Read-only Strategy kwartaal-hint; wordt in de protocolkaart getoond. */
  strategyPacingHints: StrategyPacingHints | null;
  /** Huidige budget-kalenderweek (ma–zo), server-side geformatteerd. */
  budgetWeekLabel?: string;
  simplified?: boolean;
  /** Optional strip above main content (e.g. short hint from server page). */
  heroSlot?: ReactNode;
};

export function LearningContentClient({
  protocols,
  progressMap,
  growthFocus,
  strategyPacingHints,
  budgetWeekLabel,
  simplified = false,
  heroSlot,
}: Props) {
  const [viewerProtocol, setViewerProtocol] = useState<ProtocolLibraryListRow | null>(null);
  const gameState = useHQStore((s) => s.gameState);

  const energyAvg = gameState?.stats.energy ?? null;
  const focusAvg = gameState?.stats.focus ?? null;
  const brainLogged = energyAvg != null && focusAvg != null;
  const { tier: engineTier } = weeklyDifficultyFromBrain({
    energyAvg,
    focusAvg,
    brainLogged,
  });

  return (
    <div className="space-y-4 sm:space-y-6" data-tutorial="growth-content">
      <div className="space-y-3 sm:space-y-4" data-growth-tabs>
        {!simplified && heroSlot != null ? <div className="space-y-4">{heroSlot}</div> : null}
        <div className="min-h-[120px] space-y-4">
          <section aria-label="Groei: commandocentrum" className="space-y-6">
            <GrowthCommandCenter
              protocols={protocols}
              progressMap={progressMap}
              engineTier={engineTier}
              growthFocus={growthFocus}
              strategyPacingHints={strategyPacingHints}
              budgetWeekLabel={budgetWeekLabel}
              onOpenProtocol={setViewerProtocol}
            />
          </section>
        </div>
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
