/** Whether a task counts as recovery (for recovery-only filter when load > 80). */
export function isRecoveryTask(task: {
  mission_intent?: string | null;
  energy_required?: number | null;
}): boolean {
  if (task.mission_intent === "recovery") return true;
  const energy = task.energy_required ?? 5;
  return energy <= 3;
}
