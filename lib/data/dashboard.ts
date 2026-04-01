/**
 * Dashboard aggregate payload — single HTTP surface for critical + secondary.
 */
export {
  getDashboardPayload,
  getDashboardCriticalPayload,
  getDashboardSecondaryPayload,
  revalidateDashboardCache,
} from "@/app/actions/dashboard-data";
