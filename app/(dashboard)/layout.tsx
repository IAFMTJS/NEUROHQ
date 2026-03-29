import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";
import { BootstrapGate } from "@/components/bootstrap/BootstrapGate";
import { DashboardMainContent } from "@/components/layout/DashboardMainContent";

/** Auth enforced by proxy. Client main shell applies flat glass on all routes except `/dashboard`. */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BootstrapGate>
      <DashboardLayoutClient>
        <DashboardMainContent>{children}</DashboardMainContent>
      </DashboardLayoutClient>
    </BootstrapGate>
  );
}
