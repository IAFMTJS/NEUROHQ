import { XPPageClient } from "@/components/xp/XPPageClient";
import { HQPageHeader } from "@/components/hq";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import hudStyles from "@/components/hud-test/hud.module.css";

function XPShell() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <HQPageHeader
        title="XP Nexus"
        subtitle="Effectief XP verdienen: missies, streaks en alle actieve bronnen"
        backHref="/dashboard"
      />
    </div>
  );
}

async function XPContent() {
  const today = new Date().toISOString().slice(0, 10);
  return <XPPageClient todayStr={today} />;
}

export default function XPPage() {
  return (
    <main className={`relative min-h-screen overflow-hidden ${hudStyles.cinematicBackdrop}`}>
      <div className={hudStyles.spaceMist} aria-hidden />
      <div className={hudStyles.starLayerFar} aria-hidden />
      <div className={hudStyles.starLayerNear} aria-hidden />
      <div className={hudStyles.backgroundAtmosphere} aria-hidden />
      <div className={hudStyles.colorBlend} aria-hidden />
      <div className={hudStyles.spaceNoise} aria-hidden />
      <div className="container page page-wide dashboard-cinematic relative z-10 pb-10">
        <div className="space-y-4">
          <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-5">
            <CornerNode corner="top-left" />
            <CornerNode corner="top-right" />
            <XPShell />
          </SciFiPanel>
          <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-6">
            <CornerNode corner="top-left" />
            <CornerNode corner="top-right" />
            <XPContent />
          </SciFiPanel>
        </div>
      </div>
    </main>
  );
}
