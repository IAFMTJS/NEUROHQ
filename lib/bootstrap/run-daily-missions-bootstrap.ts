import { getDailyStateForAllocator, ensureMasterMissionsForToday } from "@/app/actions/master-missions";
import { ensureReadingMissionForToday } from "@/app/actions/reading-missions";

/**
 * Zelfde logica als `POST /api/tasks/daily-bootstrap`, voorafgaand aan taken/pipeline in `GET /api/bootstrap/today`.
 */
export async function runDailyMissionsBootstrapServer(): Promise<void> {
  const dailyState = await getDailyStateForAllocator();
  await Promise.all([
    ensureMasterMissionsForToday(dailyState ?? undefined),
    ensureReadingMissionForToday().catch(() => undefined),
  ]);
}
