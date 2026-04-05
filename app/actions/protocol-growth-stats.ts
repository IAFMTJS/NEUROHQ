"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProtocolLibrary } from "@/app/actions/protocol-library";
import { getProtocolProgressMap } from "@/app/actions/protocol-progress";
import { getGrowthFocus } from "@/app/actions/growth-focus";
import { progressKey, resolveFocusProtocol } from "@/lib/growth/resolve-focus-protocol";
import { parseProtocolDefinition } from "@/lib/growth/protocol-definition";
import { protocolWeekRangeForCalendarQuarter } from "@/lib/growth/protocol-quarter-range";
import { calendarQuarterBounds } from "@/lib/strategy/engine-params";
import { todayDateString } from "@/lib/utils/timezone";

export type ProtocolQuarterMissionStats = {
  protocolSlug: string;
  locale: string;
  protocolTitle: string;
  /** Protocolweken die dit kwartaal meetellen voor het verwachte aantal taken. */
  weekRangeStart: number;
  weekRangeEnd: number;
  /** Som van taken in definitie over weekRangeStart…weekRangeEnd. */
  expectedTasks: number;
  /** Afgeronde protocol-missies met completed_at in dit kalenderkwartaal. */
  completedTasks: number;
};

function taskMatchesProtocolSlug(tags: unknown, slug: string): boolean {
  if (!Array.isArray(tags)) return false;
  const t = tags.map((x) => String(x));
  const slugTag = `protocol_slug:${slug}`;
  return t.includes("protocol") && t.includes(slugTag);
}

async function countProtocolTasksCompletedInQuarter(
  userId: string,
  slug: string,
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
  return (data as { task_tags?: unknown }[]).filter((r) => taskMatchesProtocolSlug(r.task_tags, slug)).length;
}

/**
 * Actief focus-protocol: verwachte taken over het **kalenderkwartaal** (definitie over ~13 weken aan protocolweken)
 * vs **afgerond in dit kwartaal** (completed_at binnen kwartaal, zelfde slug-tags als commitProtocolWeekToMissions).
 *
 * Gecached per request zodat Strategy snapshot + pacing dezelfde meting delen.
 */
export const getActiveProtocolQuarterMissionStats = cache(async (): Promise<ProtocolQuarterMissionStats | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = todayDateString();
  const { start: quarterStart, end: quarterEnd } = calendarQuarterBounds(today);

  const [protocols, progressMap, focus] = await Promise.all([
    getProtocolLibrary("nl"),
    getProtocolProgressMap(),
    getGrowthFocus(),
  ]);

  const active = resolveFocusProtocol(protocols, progressMap, focus);
  if (!active) return null;

  const def = parseProtocolDefinition((active as { definition_json?: unknown }).definition_json);
  if (!def) return null;

  const key = progressKey(active.slug, active.locale);
  const prog = progressMap[key];
  const currentWeekIndex = Math.max(1, prog?.current_week_index ?? 1);

  const { weekStart, weekEnd, expectedTasks } = protocolWeekRangeForCalendarQuarter({
    def,
    quarterStartYmd: quarterStart,
    quarterEndYmd: quarterEnd,
    todayYmd: today,
    currentWeekIndex,
  });

  if (expectedTasks <= 0) return null;

  const slug = active.slug;
  const completedTasks = await countProtocolTasksCompletedInQuarter(user.id, slug, quarterStart, quarterEnd);

  return {
    protocolSlug: slug,
    locale: active.locale,
    protocolTitle: (active as { title?: string }).title ?? slug,
    weekRangeStart: weekStart,
    weekRangeEnd: weekEnd,
    expectedTasks,
    completedTasks,
  };
});
