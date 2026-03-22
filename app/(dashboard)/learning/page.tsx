import { HQPageHeader } from "@/components/hq";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import hudStyles from "@/components/hud-test/hud.module.css";
import { getLearningState } from "@/app/actions/learning-state";
import { getXPIdentity } from "@/app/actions/xp";
import { getProtocolLibrary } from "@/app/actions/protocol-library";
import { getProtocolProgressMap } from "@/app/actions/protocol-progress";
import { LearningContentClient } from "@/components/growth/LearningContentClient";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ toward?: string }> };

export default async function LearningPage({ searchParams }: Props) {
  void searchParams;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [learningState, xpIdentity, protocols, progressMap] = await Promise.all([
    getLearningState(),
    getXPIdentity(),
    getProtocolLibrary("nl"),
    getProtocolProgressMap(),
  ]);

  return (
    <div className={`relative min-h-screen overflow-hidden ${hudStyles.cinematicBackdrop}`}>
      <div className={hudStyles.spaceMist} aria-hidden />
      <div className={hudStyles.starLayerFar} aria-hidden />
      <div className={hudStyles.starLayerNear} aria-hidden />
      <div className={hudStyles.backgroundAtmosphere} aria-hidden />
      <div className={hudStyles.colorBlend} aria-hidden />
      <div className={hudStyles.spaceNoise} aria-hidden />
      <div className="container page page-wide dashboard-page dashboard-cinematic relative z-10 space-y-4 pb-10">
        <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-5">
          <CornerNode corner="top-left" />
          <CornerNode corner="top-right" />
          <HQPageHeader
            title="Growth"
            subtitle="Eén systeem: protocollen (trajecten) → streams (jouw focus) → sessies → reflectie — gekoppeld aan XP en strategy."
            backHref="/dashboard"
          />
          <section className="mascot-hero mascot-hero-top mascot-hero-sharp mt-2" data-mascot-page="learning" aria-hidden>
            <div className="mascot-hero-inner mx-auto">
              <HeroMascotImage page="learning" className="mascot-img" heroLarge />
            </div>
          </section>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Gebruik de sectienavigatie hieronder: eerst overzicht en adaptive load, dan de protocolbibliotheek, daarna je
            leerpad en streams.
          </p>
        </SciFiPanel>

        <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-6">
          <CornerNode corner="top-left" />
          <CornerNode corner="top-right" />
          <LearningContentClient
            todayStr={todayStr}
            fallback={learningState}
            xpIdentity={xpIdentity}
            protocols={protocols}
            progressMap={progressMap}
          />
        </SciFiPanel>
      </div>
    </div>
  );
}
