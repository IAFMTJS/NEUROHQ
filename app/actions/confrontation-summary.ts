"use server";

import { getAvoidanceTracker } from "@/app/actions/avoidance-tracker";

export type ConfrontationSummary = {
  topAvoided: { tag: "household" | "administration" | "social"; skipped: number } | null;
  topCompleted: { tag: "household" | "administration" | "social"; completed: number } | null;
};

const TAGS: ("household" | "administration" | "social")[] = ["household", "administration", "social"];

export async function getConfrontationSummary(): Promise<ConfrontationSummary> {
  const tracker = await getAvoidanceTracker();

  let topAvoided: ConfrontationSummary["topAvoided"] = null;
  let topCompleted: ConfrontationSummary["topCompleted"] = null;

  for (const tag of TAGS) {
    const stats = tracker[tag];
    if (!stats) continue;
    if (stats.skipped > (topAvoided?.skipped ?? 0)) {
      topAvoided = { tag, skipped: stats.skipped };
    }
    if (stats.completed > (topCompleted?.completed ?? 0)) {
      topCompleted = { tag, completed: stats.completed };
    }
  }

  return { topAvoided, topCompleted };
}

