"use server";

import { revalidatePath } from "next/cache";
import { createTask } from "@/app/actions/tasks";
import { buildUserGoalMissionPreview } from "@/lib/user-goal-mission-preview";

/** Creates up to 20 tasks (rule-based, no LLM). Returns ids for undo. */
export async function commitTasksFromUserGoal(params: {
  goal: string;
  tags: string[];
}): Promise<{ created: number; taskIds: string[] }> {
  const rows = buildUserGoalMissionPreview(params.goal, params.tags);
  const taskIds: string[] = [];
  for (const row of rows) {
    const r = await createTask({
      title: row.title,
      due_date: row.due_date,
      notes: row.notes,
      category: "personal",
    });
    if (r.id) taskIds.push(r.id);
  }
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { created: taskIds.length, taskIds };
}

/** @deprecated Use commitTasksFromUserGoal */
export async function generateTasksFromUserGoal(goal: string): Promise<{ created: number }> {
  const { created } = await commitTasksFromUserGoal({ goal, tags: [] });
  return { created };
}
