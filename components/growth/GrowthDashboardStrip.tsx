import { getGrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { GrowthDashboardStripClient } from "@/components/growth/GrowthDashboardStripClient";

/** Compact strip — same snapshot as Strategy; sits under dashboard header. */
export async function GrowthDashboardStrip() {
  const [snap, prefs] = await Promise.all([getGrowthEngineSnapshot(), getUserPreferencesOrDefaults()]);
  if (!snap) return null;
  return <GrowthDashboardStripClient snap={snap} simplifiedContent={prefs.simplified_content} />;
}
