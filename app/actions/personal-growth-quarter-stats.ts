"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { calendarQuarterBounds } from "@/lib/strategy/engine-params";
import { todayDateString } from "@/lib/utils/timezone";

export type PersonalGrowthQuarterMissionStats = {
  quarterStart: string;
  quarterEnd: string;
  /** Personal Growth missies (tags: personal_growth, pg_*, pg:*). */
  expectedTasks: number;
  /** Afgerond (completed_at) binnen dit kalenderkwartaal. */
  completedTasks: number;
};

function hasPersonalGrowthTag(taskTags: unknown): boolean {
  if (!Array.isArray(taskTags)) return false;
  return taskTags.some(
    (t) => typeof t === "string" && (t === "personal_growth" || t.startsWith("pg_") || t.startsWith("pg:"))
  );
}

async function countPersonalGrowthTasksDueInQuarter(
  userId: string,
  quarterStart: string,
  quarterEnd: string
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("task_tags, deleted_at")
    .eq("user_id", userId)
    .gte("due_date", quarterStart)
    .lte("due_date", quarterEnd)
    .is("deleted_at", null);
  if (error || !data) return 0;
  return (data as Array<{ task_tags?: unknown }>).filter((r) => hasPersonalGrowthTag(r.task_tags)).length;
}

async function countPersonalGrowthTasksCompletedInQuarter(
  userId: string,
  quarterStart: string,
  quarterEnd: string
): Promise<number> {
  const supabase = await createClient();
  const fromIso = `${quarterStart}T00:00:00.000Z`;
  const toIso = `${quarterEnd}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from("tasks")
    .select("task_tags")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .eq("completed", true)
    .not("completed_at", "is", null)
    .gte("completed_at", fromIso)
    .lte("completed_at", toIso);
  if (error || !data) return 0;
  return (data as Array<{ task_tags?: unknown }>).filter((r) => hasPersonalGrowthTag(r.task_tags)).length;
}

/**
 * Quarter measure for Strategy Growth pillar, aligned with `/learning`:
 * - Denominator: Personal Growth tasks scheduled (due_date) in this calendar quarter
 * - Numerator: Personal Growth tasks completed (completed_at) in this calendar quarter
 *
 * Cached per request so Strategy snapshot + UI reuse one measurement.
 */
export const getPersonalGrowthQuarterMissionStats = cache(
  async (): Promise<PersonalGrowthQuarterMissionStats | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const today = todayDateString();
    const { start: quarterStart, end: quarterEnd } = calendarQuarterBounds(today);

    const [expectedTasks, completedTasks] = await Promise.all([
      countPersonalGrowthTasksDueInQuarter(user.id, quarterStart, quarterEnd),
      countPersonalGrowthTasksCompletedInQuarter(user.id, quarterStart, quarterEnd),
    ]);

    if (expectedTasks <= 0 && completedTasks <= 0) return null;

    return { quarterStart, quarterEnd, expectedTasks, completedTasks };
  }
);

