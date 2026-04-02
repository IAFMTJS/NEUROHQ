/** Slim column list for calendar range (month grid + selected day list). */
export const TASK_CALENDAR_RANGE_COLUMNS =
  "id, due_date, title, completed, recurrence_rule";

export type TaskListMode = "normal" | "low_energy" | "stabilize" | "driven";

/** Per-day planned load for a week (Calendar Modal 3.0: time budget, overload, burnout). */
export type DayPlannedLoad = {
  date: string;
  taskCount: number;
  totalEnergy: number;
  totalPlannedMinutes?: number;
  isOverload?: boolean;
};

export type MissionIntent = "discipline" | "recovery" | "pressure" | "alignment" | "experiment";
export type StrategyDomainTask = "discipline" | "health" | "learning" | "business";
export type AvoidanceTag = "household" | "administration" | "social";
export type HobbyTag = "fitness" | "music" | "language" | "creative";

export type SubtaskRow = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  parent_task_id: string;
  due_date: string | null;
};
