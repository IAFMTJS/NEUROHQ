"use server";

import { getDailyState } from "./daily-state";
import { getMode } from "./mode";
import { getUserPreferences } from "./preferences";
import { getWeekSummary } from "./analytics";
import { getWeekBounds } from "@/lib/utils/learning";
import { getWeeklyLearningTarget } from "./learning";
import type { ThemeId } from "@/lib/theme-tokens";
import type { EmotionKey } from "@/lib/emotions";

export type CopyVariant = "default" | "low_energy" | "driven" | "stabilize" | "high_sensory";

export type AdaptiveSuggestions = {
  themeSuggestion: ThemeId | null;
  emotionSuggestion: EmotionKey | null;
  taskCountSuggestion: number | null;
  copyVariant: CopyVariant;
};

export async function getAdaptiveSuggestions(date: string): Promise<AdaptiveSuggestions> {
  const [mode, prefs, state, weekSummary] = await Promise.all([
    getMode(date),
    getUserPreferences(),
    getDailyState(date),
    (async () => {
      const today = new Date(date + "T12:00:00");
      const { start, end } = getWeekBounds(today);
      const target = await getWeeklyLearningTarget();
      return getWeekSummary(start, end, target);
    })(),
  ]);

  const copyVariant: CopyVariant =
    mode === "low_energy" ? "low_energy"
    : mode === "driven" ? "driven"
    : mode === "stabilize" ? "stabilize"
    : mode === "high_sensory" ? "high_sensory"
    : "default";

  let themeSuggestion: ThemeId | null = null;
  let emotionSuggestion: EmotionKey | null = null;
  let taskCountSuggestion: number | null = null;

  if (mode === "low_energy" && prefs?.theme !== "girly") {
    themeSuggestion = "girly";
  }
  if (state) {
    const energy = state.energy ?? 5;
    const focus = state.focus ?? 5;
    const load = state.sensory_load ?? 5;
    if (energy >= 7 && focus >= 7 && !prefs?.selected_emotion) emotionSuggestion = "excited";
    if (energy <= 4 && !prefs?.selected_emotion) emotionSuggestion = "drained";
    if (load >= 7) emotionSuggestion = "angry";
  }
  if (weekSummary && weekSummary.totalTasksPlanned > 0) {
    const rate = weekSummary.totalTasksCompleted / weekSummary.totalTasksPlanned;
    if (rate < 0.5) taskCountSuggestion = Math.max(1, Math.ceil(weekSummary.totalTasksPlanned * 0.5));
  }

  return {
    themeSuggestion,
    emotionSuggestion,
    taskCountSuggestion,
    copyVariant,
  };
}
