"use server";

import { createClient } from "@/lib/supabase/server";
import { getXP } from "@/app/actions/xp";
import { getDailyState } from "@/app/actions/daily-state";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { PREFERENCES_DEFAULTS } from "@/types/preferences.types";
import { getUserEconomy } from "@/app/actions/economy";

export type AppBootstrap = {
  user: { id: string; email: string | null } | null;
  xp: { total_xp: number; level: number };
  economy: { discipline_points: number; focus_credits: number; momentum_boosters: number };
  preferences: Awaited<ReturnType<typeof getUserPreferencesOrDefaults>>;
  todayStr: string;
  dailyState: Awaited<ReturnType<typeof getDailyState>>;
};

/** Single bootstrap call for app-wide client state. Use in BootstrapProvider. */
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
  const [xp, economy, preferences, dailyState] = await Promise.all([
    getXP(),
    getUserEconomy(),
    getUserPreferencesOrDefaults(),
    getDailyState(todayStr),
  ]);
  return {
    user: { id: user.id, email: user.email ?? null },
    xp,
    economy,
    preferences,
    todayStr,
    dailyState,
  };
}
