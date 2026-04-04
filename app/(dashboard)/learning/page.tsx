import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getLearningState } from "@/app/actions/learning-state";
import { getXPIdentity } from "@/app/actions/xp";
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
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [prefs, learningState, xpIdentity, protocols, progressMap, growthFocus, strategyPacingHints] = await Promise.all([
    getUserPreferencesOrDefaults(),
    getLearningState(),
    getXPIdentity(),
    getProtocolLibrary("nl"),
    getProtocolProgressMap(),
    getGrowthFocus(),
    getStrategyPacingHints(),
  ]);
  const simplified = prefs.simplified_content === true;
  const lightUi = false;

  const learningBody = (
    <LearningContentClient
      todayStr={todayStr}
      fallback={learningState}
      xpIdentity={xpIdentity}
      protocols={protocols}
      progressMap={progressMap}
      growthFocus={growthFocus}
      strategyPacingHints={strategyPacingHints}
      simplified={simplified}
      heroSlot={
        !simplified ? (
          <p className="text-center text-xs text-[var(--text-muted)]">
            Minder tabs, meer uitvoeren: focus op command center en je actieve leerpad.
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

  return <GrowthPageCommandShell lightUi={lightUi}>{learningBody}</GrowthPageCommandShell>;
}
