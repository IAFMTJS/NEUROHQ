"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getGrowthFocus, type GrowthFocusState } from "@/app/actions/growth-focus";
import { getProtocolLibrary } from "@/app/actions/protocol-library";
import { getProtocolProgressMap } from "@/app/actions/protocol-progress";
import { weeklyDifficultyFromBrain, type DifficultyTier } from "@/lib/growth/adaptive-engine";
import { progressKey, resolveFocusProtocol } from "@/lib/growth/resolve-focus-protocol";

export type GrowthEngineSnapshot = {
  focus: GrowthFocusState;
  activeProtocol: {
    title: string;
    slug: string;
    locale: string;
    weekIndex: number;
    protocolTier: DifficultyTier;
  } | null;
  engineTier: DifficultyTier;
  brainLogged: boolean;
  /** True when protocol preferred tier matches engine-suggested tier. */
  tierAligned: boolean;
  hasProtocols: boolean;
};

/**
 * One call for Strategy, Dashboard, and Missions: focus protocol + engine tier from today’s brain row.
 */
export const getGrowthEngineSnapshot = cache(async (): Promise<GrowthEngineSnapshot | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);

  const [focus, protocols, progressMap, dailyRes] = await Promise.all([
    getGrowthFocus(),
    getProtocolLibrary("nl"),
    getProtocolProgressMap(),
    supabase.from("daily_state").select("energy, focus").eq("user_id", user.id).eq("date", today).maybeSingle(),
  ]);

  const row = dailyRes.data as { energy?: number | null; focus?: number | null } | null;
  const energyAvg = row?.energy ?? null;
  const focusAvg = row?.focus ?? null;
  const brainLogged = energyAvg != null && focusAvg != null;
  const { tier: engineTier } = weeklyDifficultyFromBrain({
    energyAvg,
    focusAvg,
    brainLogged,
  });

  const active = resolveFocusProtocol(protocols, progressMap, focus);
  const prog = active ? progressMap[progressKey(active.slug, active.locale)] ?? null : null;

  let activeProtocol: GrowthEngineSnapshot["activeProtocol"] = null;
  if (active) {
    const protocolTier = prog?.preferred_tier ?? "medium";
    activeProtocol = {
      title: active.title,
      slug: active.slug,
      locale: active.locale,
      weekIndex: prog?.current_week_index ?? 1,
      protocolTier,
    };
  }

  const tierAligned =
    activeProtocol != null ? activeProtocol.protocolTier === engineTier : true;

  return {
    focus,
    activeProtocol,
    engineTier,
    brainLogged,
    tierAligned,
    hasProtocols: protocols.length > 0,
  };
});
