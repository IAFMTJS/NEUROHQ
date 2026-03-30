import { XPPageClient } from "@/components/xp/XPPageClient";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import hudStyles from "@/components/hud-test/hud.module.css";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";

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
      <div className="flex min-h-0 flex-1 flex-col">
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
      </div>
    );
  }

  return (
    <div className="hq-page-surface-clear relative w-full overflow-x-hidden">
      <div className="container page page-wide dashboard-cinematic relative z-10 pb-10">
        <div className="hq-frosted-main-shell space-y-4">
          <DashboardCommandDeckFrame deckTitle="XP · command bridge" innerClassName="gap-4">
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              Kies je levensmodus, volg streaks en stuur je XP-richting.
            </p>
            <SciFiPanel
              variant="flat-glass"
              className={hudStyles.focusSecondary}
              bodyClassName="p-4 md:p-6"
            >
              <CornerNode corner="top-left" />
              <CornerNode corner="top-right" />
              <XPContent />
            </SciFiPanel>
          </DashboardCommandDeckFrame>
        </div>
      </div>
    </div>
  );
}
