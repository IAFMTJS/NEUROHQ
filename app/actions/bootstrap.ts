"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { PREFERENCES_DEFAULTS } from "@/types/preferences.types";
import type { getDailyState } from "@/app/actions/daily-state";

export type AppBootstrap = {
  user: { id: string; email: string | null } | null;
  /** Defaults; dashboard page loads XP from GET /api/dashboard/data. */
  xp: { total_xp: number; level: number };
  /** Defaults; dashboard page loads economy from dashboard API. */
  economy: { discipline_points: number; focus_credits: number; momentum_boosters: number };
  preferences: Awaited<ReturnType<typeof getUserPreferencesOrDefaults>>;
  todayStr: string;
  /** Null; dashboard page loads daily state from dashboard API to avoid duplicate fetch. */
  dailyState: Awaited<ReturnType<typeof getDailyState>>;
};

/** Minimal bootstrap for layout (user + preferences only). XP, economy, daily state come from dashboard API on the dashboard page. */
export async function getAppBootstrap(): Promise<AppBootstrap> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultBootstrap: AppBootstrap = {
    user: null,
    xp: { total_xp: 0, level: 1 },
    economy: { discipline_points: 0, focus_credits: 0, momentum_boosters: 0 },
    preferences: PREFERENCES_DEFAULTS,
    todayStr,
    dailyState: null,
  };
  if (!user) return defaultBootstrap;
  const preferences = await getUserPreferencesOrDefaults();
  return {
    user: { id: user.id, email: user.email ?? null },
    xp: defaultBootstrap.xp,
    economy: defaultBootstrap.economy,
    preferences,
    todayStr,
    dailyState: null,
  };
}
