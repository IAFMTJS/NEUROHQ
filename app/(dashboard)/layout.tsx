import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";
import { BootstrapGate } from "@/components/bootstrap/BootstrapGate";
import { DashboardMainContent } from "@/components/layout/DashboardMainContent";

/** Auth enforced by proxy. Client main uses flat-glass ambient scroll shell on all dashboard routes. */
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
