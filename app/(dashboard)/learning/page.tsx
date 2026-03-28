import { Suspense } from "react";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getLearningState } from "@/app/actions/learning-state";
import { getXPIdentity } from "@/app/actions/xp";
import { getProtocolLibrary } from "@/app/actions/protocol-library";
import { getProtocolProgressMap } from "@/app/actions/protocol-progress";
import { getGrowthFocus } from "@/app/actions/growth-focus";
import { LearningContentClient } from "@/components/growth/LearningContentClient";
import { GrowthPageCommandShell } from "@/components/growth/GrowthPageCommandShell";
import { StrategyEnginePaceHint } from "@/components/strategy/StrategyEnginePaceHint";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ toward?: string }> };

export default async function LearningPage({ searchParams }: Props) {
  void searchParams;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [prefs, learningState, xpIdentity, protocols, progressMap, growthFocus] = await Promise.all([
    getUserPreferencesOrDefaults(),
    getLearningState(),
    getXPIdentity(),
    getProtocolLibrary("nl"),
    getProtocolProgressMap(),
    getGrowthFocus(),
  ]);
  const simplified = prefs.simplified_content === true;
  const lightUi = prefs.light_ui === true;

  const learningBody = (
    <LearningContentClient
      todayStr={todayStr}
      fallback={learningState}
      xpIdentity={xpIdentity}
      protocols={protocols}
      progressMap={progressMap}
      growthFocus={growthFocus}
      simplified={simplified}
      heroSlot={
        !simplified ? (
          <div className="space-y-4">
            <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="learning" aria-hidden>
              <div className="mascot-hero-inner mx-auto">
                <HeroMascotImage page="learning" className="mascot-img" heroLarge />
              </div>
            </section>
            <Suspense fallback={null}>
              <StrategyEnginePaceHint variant="learning" />
            </Suspense>
            <p className="text-center text-xs text-[var(--text-muted)]">
              Minder tabs, meer uitvoeren: focus op command center en je actieve leerpad.
            </p>
          </div>
        ) : undefined
      }
    />
  );

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Growth"
          footerLinks={[
            { href: "/tasks", label: "Missions" },
            { href: "/dashboard", label: "HQ" },
            { href: "/budget", label: "Budget" },
          ]}
          topSlot={
            <Suspense fallback={null}>
              <StrategyEnginePaceHint variant="learning" />
            </Suspense>
          }
        >
          {learningBody}
        </SimplifiedPageShell>
      </div>
    );
  }

  return <GrowthPageCommandShell lightUi={lightUi}>{learningBody}</GrowthPageCommandShell>;
}
