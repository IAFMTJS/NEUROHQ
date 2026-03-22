import { getGrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { GrowthDashboardStripClient } from "@/components/growth/GrowthDashboardStripClient";

/** Compact strip — same snapshot as Strategy; sits under dashboard header. */
export async function GrowthDashboardStrip() {
  const snap = await getGrowthEngineSnapshot();
  if (!snap) return null;
  return <GrowthDashboardStripClient snap={snap} />;
}
