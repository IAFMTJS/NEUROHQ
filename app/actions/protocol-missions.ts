"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTask } from "@/app/actions/tasks";
import { parseProtocolDefinition, getScaledTask, weekForIndex } from "@/lib/growth/protocol-definition";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";
import { assignProtocolTaskDueDatesFromWeek } from "@/lib/growth/spread-protocol-due-dates";
import { getBudgetWeekBounds } from "@/lib/utils/budget-date";
import { todayDateString } from "@/lib/utils/timezone";

const PTASK_MARKER = (id: string) => `ptask:${id}`;

function protocolTaskBaseXp(minutes: number, tier: DifficultyTier): number {
  const tierBonus = tier === "hard" ? 12 : tier === "medium" ? 6 : 2;
  return Math.max(8, Math.min(120, Math.round(minutes * 0.9) + tierBonus));
}

function notesMatchProtocolWeek(notes: string, protocolSlug: string, weekIndex: number): boolean {
  const lines = notes.split("\n").map((l) => l.trim());
  return lines.includes(`protocol:${protocolSlug}`) && lines.includes(`week:${weekIndex}`);
}

function extractPtaskId(notes: string): string | null {
  const m = notes.match(/ptask:([^\s]+)/);
  return m ? m[1] : null;
}

/**
 * Push current protocol week tasks to Missions, deduped by ptask id anywhere in the current budget week.
 * Default: due dates volgen `day_overview` / `preferred_days` per taak waar aanwezig, anders gespreid over de rest van de week.
 * Met expliciete `due_date`: alle nieuwe taken op die dag (legacy).
 */
export async function commitProtocolWeekToMissions(params: {
  protocol_slug: string;
  locale?: string;
  /** Alle taken op deze dag; als gezet, geen week-spreiding. */
  due_date?: string;
}): Promise<{ created: number; skipped: number; taskIds: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const locale = params.locale ?? "nl";
  const anchorToday = todayDateString();
  const forceSingleDay = params.due_date != null && params.due_date !== "";
  const singleDue = forceSingleDay ? params.due_date! : null;

  const { data: row, error: rowErr } = await supabase
    .from("protocol_library")
    .select("id, slug, locale, title, definition_json")
    .eq("slug", params.protocol_slug)
    .eq("locale", locale)
    .maybeSingle();

  if (rowErr || !row) throw new Error("Protocol niet gevonden.");

  const def = parseProtocolDefinition((row as { definition_json?: unknown }).definition_json);
  if (!def) throw new Error("Dit protocol heeft geen structured definition.");

  const { data: prog } = await supabase
    .from("user_protocol_progress")
    .select("preferred_tier, current_week_index")
    .eq("user_id", user.id)
    .eq("protocol_slug", params.protocol_slug)
    .eq("locale", locale)
    .maybeSingle();

  const tier = (prog?.preferred_tier as DifficultyTier) || "medium";
  const weekIndex = Math.max(1, prog?.current_week_index ?? 1);
  const week = weekForIndex(def, weekIndex);
  if (!week) throw new Error(`Geen week ${weekIndex} in dit protocol.`);

  const titlePrefix = (row as { title?: string }).title?.slice(0, 48) ?? params.protocol_slug;

  const { start: weekStart, end: weekEnd } = getBudgetWeekBounds(anchorToday);
  const { data: existingInWeek } = await supabase
    .from("tasks")
    .select("notes")
    .eq("user_id", user.id)
    .gte("due_date", weekStart)
    .lte("due_date", weekEnd)
    .is("deleted_at", null);

  const existingMarkers = new Set<string>();
  for (const t of existingInWeek ?? []) {
    const n = (t as { notes?: string | null }).notes ?? "";
    if (!notesMatchProtocolWeek(n, params.protocol_slug, weekIndex)) continue;
    const id = extractPtaskId(n);
    if (id) existingMarkers.add(id);
  }

  const spreadDueDates = forceSingleDay
    ? null
    : assignProtocolTaskDueDatesFromWeek(week.tasks, week, anchorToday);

  const taskIds: string[] = [];
  let skipped = 0;
  let created = 0;

  for (let ti = 0; ti < week.tasks.length; ti++) {
    const task = week.tasks[ti];
    if (existingMarkers.has(task.id)) {
      skipped++;
      continue;
    }

    const dueDate = forceSingleDay ? singleDue! : spreadDueDates![ti];

    const scaled = getScaledTask(task, tier);
    const notes = [
      scaled.concrete,
      task.success_criteria ? `Succescriterium: ${task.success_criteria}` : null,
      task.execution_steps && task.execution_steps.length > 0
        ? `Execution steps:\n${task.execution_steps.map((step, idx) => `${idx + 1}. ${step}`).join("\n")}`
        : null,
      task.checklist && task.checklist.length > 0
        ? `Checklist:\n${task.checklist.map((c) => `- ${c}`).join("\n")}`
        : null,
      task.reflection_prompt ? `Reflectie: ${task.reflection_prompt}` : null,
      task.reflection_block?.prompt ? `Reflectieblok: ${task.reflection_block.prompt}` : null,
      "",
      "---",
      `protocol:${params.protocol_slug}`,
      PTASK_MARKER(task.id),
      `week:${weekIndex}`,
      `tier:${tier}`,
    ]
      .filter((line): line is string => !!line)
      .join("\n");

    const r = await createTask({
      title: `${titlePrefix} · ${task.title}`.slice(0, 200),
      due_date: dueDate,
      notes,
      category: "personal",
      domain: "learning",
      mission_intent: "experiment",
      task_type: "mental",
      duration_minutes: scaled.minutes,
      base_xp: protocolTaskBaseXp(scaled.minutes, tier),
      task_tags: [
        "growth",
        "protocol",
        params.protocol_slug,
        `protocol_slug:${params.protocol_slug}`,
        `protocol_locale:${locale}`,
        `protocol_week:${weekIndex}`,
        `protocol_task:${task.id}`,
        `protocol_tier:${tier}`,
      ],
    });
    if (r.id) {
      taskIds.push(r.id);
      created++;
    }
  }

  revalidatePath("/learning");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { created, skipped, taskIds };
}
