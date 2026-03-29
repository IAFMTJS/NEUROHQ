"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTask } from "@/app/actions/tasks";
import { parseProtocolDefinition, getScaledTask, weekForIndex } from "@/lib/growth/protocol-definition";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";

const PTASK_MARKER = (id: string) => `ptask:${id}`;

function protocolTaskBaseXp(minutes: number, tier: DifficultyTier): number {
  const tierBonus = tier === "hard" ? 12 : tier === "medium" ? 6 : 2;
  return Math.max(8, Math.min(120, Math.round(minutes * 0.9) + tierBonus));
}

/** Push current protocol week tasks to Missions board (tasks table), deduped by ptask id + due date. */
export async function commitProtocolWeekToMissions(params: {
  protocol_slug: string;
  locale?: string;
  /** Defaults to today (UTC date). */
  due_date?: string;
}): Promise<{ created: number; skipped: number; taskIds: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const locale = params.locale ?? "nl";
  const dueDate = params.due_date ?? new Date().toISOString().slice(0, 10);

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

  const { data: existingToday } = await supabase
    .from("tasks")
    .select("id, notes")
    .eq("user_id", user.id)
    .eq("due_date", dueDate)
    .is("deleted_at", null);

  const existingMarkers = new Set<string>();
  for (const t of existingToday ?? []) {
    const n = (t as { notes?: string | null }).notes ?? "";
    const m = n.match(/ptask:([^\s]+)/);
    if (m) existingMarkers.add(m[1]);
  }

  const taskIds: string[] = [];
  let skipped = 0;
  let created = 0;

  for (const task of week.tasks) {
    if (existingMarkers.has(task.id)) {
      skipped++;
      continue;
    }

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
  return { created, skipped, taskIds };
}
