import { XPPageClient } from "@/components/xp/XPPageClient";
import { HQPageHeader } from "@/components/hq";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import hudStyles from "@/components/hud-test/hud.module.css";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";

function XPShell() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <HQPageHeader
        title="XP Command Bridge"
        subtitle="Kies je levensmodus, volg streaks en stuur je XP-richting."
        backHref="/dashboard"
      />
    </div>
  );
}

async function XPContent() {
  const today = new Date().toISOString().slice(0, 10);
  return <XPPageClient todayStr={today} />;
}

export default async function XPPage() {
  const prefs = await getUserPreferencesOrDefaults();
  const simplified = prefs.simplified_content === true;
  const todayStr = new Date().toISOString().slice(0, 10);

  if (simplified) {
    return (
      <main className="flex min-h-0 flex-1 flex-col">
        <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
          <SimplifiedPageShell
            title="XP"
            footerLinks={[
              { href: "/tasks", label: "Missions" },
              { href: "/report", label: "Insights" },
              { href: "/dashboard", label: "HQ" },
            ]}
          >
            <XPPageClient todayStr={todayStr} />
          </SimplifiedPageShell>
        </div>
      </main>
    );
  }

  return (
    <div className="relative min-h-0 w-full flex-1 overflow-hidden">
      <div className="space-y-4">
        <SciFiPanel
          flatFrame
          variant="glass"
          className={hudStyles.focusSecondary}
          bodyClassName="p-4 md:p-5"
        >
          <CornerNode corner="top-left" />
          <CornerNode corner="top-right" />
          <XPShell />
        </SciFiPanel>
        <SciFiPanel
          flatFrame
          variant="glass"
          className={hudStyles.focusSecondary}
          bodyClassName="p-4 md:p-6"
        >
          <CornerNode corner="top-left" />
          <CornerNode corner="top-right" />
          <XPContent />
        </SciFiPanel>
      </div>
    </div>
  );
}
