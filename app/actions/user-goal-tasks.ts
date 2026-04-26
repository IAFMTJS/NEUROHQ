"use server";

import { revalidatePath } from "next/cache";
import { createTask } from "@/app/actions/tasks";
import { createHash } from "crypto";
import { buildPersonalGrowthMissionPreview, buildUserGoalMissionPreview } from "@/lib/user-goal-mission-preview";

type PersonalGrowthIntensity = "light" | "normal" | "intense";

function slugifyLabel(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function hashGoal(goal: string): string {
  return createHash("sha256").update(goal.trim()).digest("hex").slice(0, 12);
}

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

/** Personal Growth hub: creates tasks for area+goal and returns ids for undo. */
export async function commitTasksFromPersonalGrowth(params: {
  area: string | null;
  goal: string;
  tags: string[];
  intensity: PersonalGrowthIntensity;
  horizonDays: number;
}): Promise<{ created: number; taskIds: string[] }> {
  const rows = buildPersonalGrowthMissionPreview({
    area: params.area ?? null,
    goal: params.goal,
    tags: params.tags,
    intensity: params.intensity,
    horizonDays: params.horizonDays,
  });

  const goalHash = hashGoal(params.goal);
  const areaSlug = params.area ? slugifyLabel(params.area) : "custom";
  const baseTags = [
    "growth",
    "personal_growth",
    `pg_area:${areaSlug}`,
    `pg_goal:${goalHash}`,
    `pg_intensity:${params.intensity}`,
  ];
  const userTags = (params.tags ?? [])
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((t) => `pg_tag:${slugifyLabel(t)}`);

  const taskIds: string[] = [];
  for (const row of rows) {
    const r = await createTask({
      title: row.title,
      due_date: row.due_date,
      notes: row.notes,
      category: "personal",
      task_tags: [...baseTags, ...userTags],
    });
    if (r.id) taskIds.push(r.id);
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/learning");
  return { created: taskIds.length, taskIds };
}

/** @deprecated Use commitTasksFromUserGoal */
export async function generateTasksFromUserGoal(goal: string): Promise<{ created: number }> {
  const { created } = await commitTasksFromUserGoal({ goal, tags: [] });
  return { created };
}
