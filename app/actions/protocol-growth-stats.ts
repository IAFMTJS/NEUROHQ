"use server";

import { createClient } from "@/lib/supabase/server";
import { getProtocolLibrary } from "@/app/actions/protocol-library";
import { getProtocolProgressMap } from "@/app/actions/protocol-progress";
import { getGrowthFocus } from "@/app/actions/growth-focus";
import { progressKey, resolveFocusProtocol } from "@/lib/growth/resolve-focus-protocol";
import { parseProtocolDefinition, weekForIndex } from "@/lib/growth/protocol-definition";

export type ProtocolWeekMissionStats = {
  protocolSlug: string;
  locale: string;
  protocolTitle: string;
  weekIndex: number;
  /** Taken in protocoldefinitie voor deze week. */
  expected: number;
  /** Afgeronde missions op het bord met deze week + slug tags. */
  completed: number;
};

/**
 * Actief focus-protocol + huidige week: verwachte missies (definitie) vs afgerond op het Missions-bord.
 * Zelfde tags als `commitProtocolWeekToMissions` (`protocol`, `protocol_slug:…`, `protocol_week:N`).
 */
export async function getActiveProtocolWeekMissionStats(): Promise<ProtocolWeekMissionStats | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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
  const weekIndex = Math.max(1, prog?.current_week_index ?? 1);
  const week = weekForIndex(def, weekIndex);
  const expected = week?.tasks.length ?? 0;
  if (expected <= 0) return null;

  const slug = active.slug;
  const locale = active.locale;
  const tagFilter = JSON.stringify(["protocol", `protocol_slug:${slug}`, `protocol_week:${weekIndex}`]);

  const filtered = await supabase
    .from("tasks")
    .select("completed")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .contains("task_tags", tagFilter);

  let rows = (filtered.data ?? []) as { completed?: boolean }[];

  if (filtered.error) {
    const fallback = await supabase
      .from("tasks")
      .select("completed, task_tags")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .not("task_tags", "is", null);
    const slugTag = `protocol_slug:${slug}`;
    const weekTag = `protocol_week:${weekIndex}`;
    rows = (fallback.data ?? []).filter((r) => {
      const tags = r.task_tags;
      if (!Array.isArray(tags)) return false;
      const t = tags.map((x) => String(x));
      return t.includes("protocol") && t.includes(slugTag) && t.includes(weekTag);
    }) as { completed?: boolean }[];
  }

  const completed = rows.filter((r) => r.completed === true).length;

  return {
    protocolSlug: slug,
    locale,
    protocolTitle: (active as { title?: string }).title ?? slug,
    weekIndex,
    expected,
    completed,
  };
}
