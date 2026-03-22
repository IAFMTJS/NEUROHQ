"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTask } from "@/app/actions/tasks";
import { parseProtocolDefinition, getScaledTask, weekForIndex } from "@/lib/growth/protocol-definition";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";

const PTASK_MARKER = (id: string) => `ptask:${id}`;

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
      "",
      "---",
      `protocol:${params.protocol_slug}`,
      PTASK_MARKER(task.id),
      `week:${weekIndex}`,
      `tier:${tier}`,
    ].join("\n");

    const r = await createTask({
      title: `${titlePrefix} · ${task.title}`.slice(0, 200),
      due_date: dueDate,
      notes,
      category: "personal",
      mission_intent: "experiment",
      task_type: "mental",
      duration_minutes: scaled.minutes,
      base_xp: tier === "hard" ? 15 : tier === "easy" ? 8 : 10,
      task_tags: ["growth", "protocol", params.protocol_slug],
    });
    if (r.id) {
      taskIds.push(r.id);
      created++;
    }
  }

  revalidatePath("/learning");
  return { created, skipped, taskIds };
}
