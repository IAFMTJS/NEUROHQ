import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";
import { BootstrapGate } from "@/components/bootstrap/BootstrapGate";
import { DashboardMainContent } from "@/components/layout/DashboardMainContent";
import { getStrategyAppReviewLockState } from "@/app/actions/strategyFocus";

/** Auth enforced by proxy. Client main uses flat-glass ambient scroll shell on all dashboard routes. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locked } = await getStrategyAppReviewLockState();

  return (
    <BootstrapGate>
      <DashboardLayoutClient strategyWeeklyReviewLocked={locked}>
        <DashboardMainContent>{children}</DashboardMainContent>
      </DashboardLayoutClient>
    </BootstrapGate>
  );
}
