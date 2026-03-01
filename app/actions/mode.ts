"use server";

import { getModeFromState, type AppMode, type DailyStateForMode } from "@/lib/app-mode";
import { getDailyState } from "./daily-state";
import { getCarryOverCountForDate } from "./tasks";

export async function getMode(date: string): Promise<AppMode> {
  const [state, carryOverCount] = await Promise.all([
    getDailyState(date),
    getCarryOverCountForDate(date),
  ]);

  return getModeFromState(state as DailyStateForMode, carryOverCount);
}
