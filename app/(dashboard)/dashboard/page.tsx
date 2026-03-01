import { DashboardClientShell } from "@/components/dashboard/DashboardClientShell";

/** Static shell: fast first paint. Data loads client-side (critical → secondary). */
export const dynamic = "force-static";

export default function DashboardPage() {
  return <DashboardClientShell />;
}
