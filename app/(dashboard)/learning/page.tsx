import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getProtocolLibrary } from "@/app/actions/protocol-library";
import { getProtocolProgressMap } from "@/app/actions/protocol-progress";
import { getGrowthFocus } from "@/app/actions/growth-focus";
import { getStrategyPacingHints } from "@/app/actions/strategy-engine-pacing";
import { LearningContentClient } from "@/components/growth/LearningContentClient";
import { GrowthPageCommandShell } from "@/components/growth/GrowthPageCommandShell";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ toward?: string }> };

export default async function LearningPage({ searchParams }: Props) {
  void searchParams;
  const [prefs, protocols, progressMap, growthFocus, strategyPacingHints] = await Promise.all([
    getUserPreferencesOrDefaults(),
    getProtocolLibrary("nl"),
    getProtocolProgressMap(),
    getGrowthFocus(),
    getStrategyPacingHints(),
  ]);
  const simplified = prefs.simplified_content === true;

  const learningBody = (
    <LearningContentClient
      protocols={protocols}
      progressMap={progressMap}
      growthFocus={growthFocus}
      strategyPacingHints={strategyPacingHints}
      simplified={simplified}
      heroSlot={
        !simplified ? (
          <p className="text-center text-xs text-[var(--text-muted)]">
            Protocolfocus en kwartaalritme — alles wat je nodig hebt om Growth uit te voeren.
          </p>
        ) : undefined
      }
    />
  );

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Growth"
          hideTitleBar
          footerLinks={[
            { href: "/tasks", label: "Missions" },
            { href: "/dashboard", label: "HQ" },
            { href: "/budget", label: "Budget" },
          ]}
        >
          {learningBody}
        </SimplifiedPageShell>
      </div>
    );
  }

  return <GrowthPageCommandShell>{learningBody}</GrowthPageCommandShell>;
}
