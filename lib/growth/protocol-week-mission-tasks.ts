import type { ProtocolTask } from "@/lib/growth/protocol-definition";

/**
 * Subset of weekly protocol tasks that are materialized on Missions (auto-sync + manual commit).
 * At most floor(n/2) tasks, spread across the week's list (even indices first), minimum 1 when n ≥ 1.
 */
export function selectProtocolTasksForWeeklyMissions(tasks: ProtocolTask[]): ProtocolTask[] {
  if (tasks.length === 0) return [];
  const everyOther = tasks.filter((_, i) => i % 2 === 0);
  const cap = Math.max(1, Math.floor(tasks.length / 2));
  return everyOther.slice(0, cap);
}
