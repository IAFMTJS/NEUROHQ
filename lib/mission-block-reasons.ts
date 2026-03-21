import { isRecoveryTask } from "@/lib/recovery-task";
import type { Task } from "@/types/database.types";

export type TaskListModeForMissions = "normal" | "low_energy" | "stabilize" | "driven";

/** Why a mission cannot be started yet (shown in UI; complete button disabled). */
export function buildBlockedReasonsForTasks(
  tasks: Task[],
  opts: { taskMode: TaskListModeForMissions; recoveryOnly: boolean }
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of tasks) {
    if (opts.recoveryOnly && !isRecoveryTask(t)) {
      out[t.id] = "Recovery-protocol: voltooi eerst een lichte of recovery-missie.";
    } else if (opts.taskMode === "low_energy" && (t.energy_required ?? 0) >= 4) {
      out[t.id] = "Te zwaar voor je energie vandaag. Pas brain status aan of kies een missie onder energie 4.";
    }
  }
  return out;
}
