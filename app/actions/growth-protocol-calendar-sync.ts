"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { commitProtocolWeekToMissions } from "@/app/actions/protocol-missions";
import { upsertProtocolProgress } from "@/app/actions/protocol-progress";
import { parseProtocolDefinition, maxWeekIndex } from "@/lib/growth/protocol-definition";
import { getBudgetWeekBounds, wholeBudgetWeeksBetween } from "@/lib/utils/budget-date";
import { todayDateString } from "@/lib/utils/timezone";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";
import type { UserProtocolProgressRow } from "@/app/actions/protocol-progress";

function parseTierLocal(s: string | null | undefined): DifficultyTier {
  if (s === "easy" || s === "hard" || s === "medium") return s;
  return "medium";
}

function parseIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

function calendarMondayFromRow(row: UserProtocolProgressRow | null): string | null {
  const v = row?.growth_calendar_week_start;
  if (v == null || v === "") return null;
  return typeof v === "string" ? v.slice(0, 10) : String(v).slice(0, 10);
}

/**
 * When the budget week (Mon–Sun) advances, bump focus-protocol `current_week_index` and push that week's tasks to Missions.
 * Idempotent per calendar week (anchor stored on `user_protocol_progress.growth_calendar_week_start`).
 * Call from /learning and /tasks so Missions stays in sync without opening Growth.
 */
export async function syncGrowthFocusProtocolToCalendarWeek(): Promise<{
  didRoll: boolean;
  calendarWeeksAdvanced: number;
  missionCommit: { created: number; skipped: number } | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
  }

  const { data: prefs, error: prefErr } = await supabase
    .from("user_preferences")
    .select("growth_focus_protocol_slug, growth_focus_protocol_locale")
    .eq("user_id", user.id)
    .maybeSingle();

  if (prefErr) {
    const msg = prefErr.message ?? "";
    if (prefErr.code === "42703" || msg.includes("growth_focus")) {
      return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
    }
    if (process.env.NODE_ENV === "development") console.warn("syncGrowthFocusProtocolToCalendarWeek prefs:", msg);
    return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
  }

  const slug = (prefs as { growth_focus_protocol_slug?: string | null } | null)?.growth_focus_protocol_slug ?? null;
  if (!slug) {
    return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
  }

  const locale =
    (prefs as { growth_focus_protocol_locale?: string | null } | null)?.growth_focus_protocol_locale ?? "nl";

  const today = todayDateString();
  const { start: thisMonday } = getBudgetWeekBounds(today);

  const { data: libRow, error: libErr } = await supabase
    .from("protocol_library")
    .select("definition_json")
    .eq("slug", slug)
    .eq("locale", locale)
    .maybeSingle();

  if (libErr || !libRow) {
    return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
  }

  const def = parseProtocolDefinition((libRow as { definition_json?: unknown }).definition_json);
  if (!def) {
    return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
  }

  const maxW = maxWeekIndex(def);

  const { data: prog, error: progErr } = await supabase
    .from("user_protocol_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("protocol_slug", slug)
    .eq("locale", locale)
    .maybeSingle();

  if (progErr) {
    if (process.env.NODE_ENV === "development") console.warn("syncGrowthFocusProtocolToCalendarWeek prog:", progErr.message);
    return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
  }

  if (!prog) {
    return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
  }

  const row = prog as UserProtocolProgressRow;
  let anchor = calendarMondayFromRow(row);

  try {
    if (!anchor) {
      await upsertProtocolProgress(user.id, {
        protocol_slug: slug,
        locale,
        growth_calendar_week_start: thisMonday,
      });
      revalidatePath("/learning");
      revalidatePath("/tasks");
      return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
    }

    if (anchor === thisMonday) {
      return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
    }

    if (thisMonday < anchor) {
      await upsertProtocolProgress(user.id, {
        protocol_slug: slug,
        locale,
        growth_calendar_week_start: thisMonday,
      });
      revalidatePath("/learning");
      revalidatePath("/tasks");
      return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
    }

    const steps = wholeBudgetWeeksBetween(anchor, thisMonday);
    if (steps <= 0) {
      await upsertProtocolProgress(user.id, {
        protocol_slug: slug,
        locale,
        growth_calendar_week_start: thisMonday,
      });
      revalidatePath("/learning");
      revalidatePath("/tasks");
      return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
    }

    const prevWeek = Math.max(1, row.current_week_index ?? 1);
    const nextWeek = Math.min(maxW, prevWeek + steps);

    await upsertProtocolProgress(user.id, {
      protocol_slug: slug,
      locale,
      current_week_index: nextWeek,
      preferred_tier: parseTierLocal(row.preferred_tier),
      completed_task_ids: parseIds(row.completed_task_ids),
      growth_calendar_week_start: thisMonday,
    });

    const missionCommit = await commitProtocolWeekToMissions({ protocol_slug: slug, locale });

    revalidatePath("/learning");
    revalidatePath("/tasks");
    revalidatePath("/dashboard");

    return {
      didRoll: true,
      calendarWeeksAdvanced: steps,
      missionCommit: { created: missionCommit.created, skipped: missionCommit.skipped },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("growth_calendar_week") || msg.includes("42703")) {
      return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
    }
    if (process.env.NODE_ENV === "development") console.warn("syncGrowthFocusProtocolToCalendarWeek:", msg);
    return { didRoll: false, calendarWeeksAdvanced: 0, missionCommit: null };
  }
}
