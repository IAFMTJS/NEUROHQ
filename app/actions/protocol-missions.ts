"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBundledProtocolBySlugLocale } from "@/lib/growth/protocol-presets";
import { createTask } from "@/app/actions/tasks";
import { revalidateTagMax } from "@/lib/revalidate";
import { parseProtocolDefinition, getScaledTask, weekForIndex } from "@/lib/growth/protocol-definition";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";
import { assignProtocolTaskDueDatesFromWeek } from "@/lib/growth/spread-protocol-due-dates";
import { selectProtocolTasksForWeeklyMissions } from "@/lib/growth/protocol-week-mission-tasks";
import { getBudgetWeekBounds } from "@/lib/utils/budget-date";
import { todayDateString } from "@/lib/utils/timezone";
import { upsertProtocolProgress } from "@/app/actions/protocol-progress";
import { invalidateUserSnapshotMemoryCaches } from "@/lib/server/snapshot-memory-caches";

const PTASK_MARKER = (id: string) => `ptask:${id}`;
const CATCHUP_ROUND_TAG = "protocol_catchup_round:";
const CATCHUP_TAG = "protocol_catchup";

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

function extractProtocolSlugFromNotes(notes: string): string | null {
  for (const raw of notes.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("protocol:")) continue;
    const slug = line.slice("protocol:".length).trim();
    if (slug) return slug;
  }
  return null;
}

/** Identity from tags (preferred) or legacy `protocol:` line in notes. */
function protocolIdentityFromTask(tags: string[], notes: string): { slug: string; locale: string | null } | null {
  for (const t of tags) {
    if (!t.startsWith("protocol_slug:")) continue;
    const slug = t.slice("protocol_slug:".length).trim();
    if (!slug) continue;
    let locale: string | null = null;
    for (const u of tags) {
      if (u.startsWith("protocol_locale:")) {
        locale = u.slice("protocol_locale:".length).trim() || null;
        break;
      }
    }
    return { slug, locale };
  }
  const fromNotes = extractProtocolSlugFromNotes(notes);
  return fromNotes ? { slug: fromNotes, locale: null } : null;
}

function isOtherProtocolMission(
  tags: string[],
  notes: string,
  keepSlug: string,
  keepLocale: string,
): boolean {
  if (!tags.includes("protocol")) return false;
  const id = protocolIdentityFromTask(tags, notes);
  if (!id) return false;
  if (id.slug !== keepSlug) return true;
  if (id.locale != null && id.locale !== keepLocale) return true;
  return false;
}

/**
 * Soft-delete open protocol missions in the budget week that belong to another protocol (or locale).
 * Keeps Missions aligned when switching growth focus.
 */
async function withdrawOtherProtocolMissionsInBudgetWeek(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  keepSlug: string,
  keepLocale: string,
  weekStart: string,
  weekEnd: string,
): Promise<{ withdrawn: number; dueDates: string[] }> {
  const { data: rows, error } = await supabase
    .from("tasks")
    .select("id, due_date, task_tags, notes")
    .eq("user_id", userId)
    .gte("due_date", weekStart)
    .lte("due_date", weekEnd)
    .eq("completed", false)
    .is("parent_task_id", null)
    .is("deleted_at", null);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("withdrawOtherProtocolMissionsInBudgetWeek:", error.message);
    }
    return { withdrawn: 0, dueDates: [] };
  }

  const ids: string[] = [];
  const dueDates: string[] = [];
  for (const row of rows ?? []) {
    const tags = normalizeTaskTags((row as { task_tags?: unknown }).task_tags);
    const notes = (row as { notes?: string | null }).notes ?? "";
    if (!isOtherProtocolMission(tags, notes, keepSlug, keepLocale)) continue;
    ids.push((row as { id: string }).id);
    const dd = (row as { due_date?: string }).due_date;
    if (dd) dueDates.push(dd);
  }

  if (ids.length === 0) return { withdrawn: 0, dueDates: [] };

  const now = new Date().toISOString();
  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error: upErr } = await supabase
      .from("tasks")
      .update({ deleted_at: now, updated_at: now })
      .in("id", chunk)
      .eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);
  }

  for (const d of new Set(dueDates)) {
    revalidateTagMax(`tasks-${userId}-${d}`);
  }
  revalidateTagMax("decision-blocks");
  invalidateUserSnapshotMemoryCaches(userId);
  revalidatePath("/tasks");
  revalidatePath("/learning");
  revalidatePath("/dashboard");

  return { withdrawn: ids.length, dueDates };
}

function normalizeTaskTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function catchupRoundFromTags(tags: string[]): number | null {
  for (const tag of tags) {
    if (!tag.startsWith(CATCHUP_ROUND_TAG)) continue;
    const n = Number.parseInt(tag.slice(CATCHUP_ROUND_TAG.length), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
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
}): Promise<{ created: number; skipped: number; taskIds: string[]; withdrawn: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const locale = params.locale ?? "nl";
  const anchorToday = todayDateString();
  const forceSingleDay = params.due_date != null && params.due_date !== "";
  const singleDue = forceSingleDay ? params.due_date! : null;

  const row = getBundledProtocolBySlugLocale(params.protocol_slug, locale);
  if (!row) throw new Error("Protocol niet gevonden.");

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

  const tasksForMissions = selectProtocolTasksForWeeklyMissions(week.tasks);

  const titlePrefix = (row as { title?: string }).title?.slice(0, 48) ?? params.protocol_slug;

  const { start: weekStart, end: weekEnd } = getBudgetWeekBounds(anchorToday);
  const { withdrawn } = await withdrawOtherProtocolMissionsInBudgetWeek(
    supabase,
    user.id,
    params.protocol_slug,
    locale,
    weekStart,
    weekEnd,
  );

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
    : assignProtocolTaskDueDatesFromWeek(tasksForMissions, week, anchorToday);

  const taskIds: string[] = [];
  let skipped = 0;
  let created = 0;

  for (let ti = 0; ti < tasksForMissions.length; ti++) {
    const task = tasksForMissions[ti];
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

  try {
    await upsertProtocolProgress(user.id, {
      protocol_slug: params.protocol_slug,
      locale,
      growth_calendar_week_start: weekStart,
    });
  } catch {
    /* DB zonder migratie 120: kolom ontbreekt — commit blijft geldig. */
  }

  revalidatePath("/learning");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { created, skipped, taskIds, withdrawn };
}

/**
 * Adds a new catch-up round with protocol-linked tasks for the current protocol week.
 * Unlike normal week commit, catch-up intentionally creates new tasks to recover momentum.
 */
export async function createProtocolCatchupRound(params: {
  protocol_slug: string;
  locale?: string;
  max_tasks?: number;
}): Promise<{ created: number; skipped: number; round: number; taskIds: string[]; plannedTaskTitles: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const locale = params.locale ?? "nl";
  const anchorToday = todayDateString();

  const row = getBundledProtocolBySlugLocale(params.protocol_slug, locale);
  if (!row) throw new Error("Protocol niet gevonden.");

  const def = parseProtocolDefinition((row as { definition_json?: unknown }).definition_json);
  if (!def) throw new Error("Dit protocol heeft geen structured definition.");

  const { data: prog } = await supabase
    .from("user_protocol_progress")
    .select("preferred_tier, current_week_index, completed_task_ids")
    .eq("user_id", user.id)
    .eq("protocol_slug", params.protocol_slug)
    .eq("locale", locale)
    .maybeSingle();

  const tier = (prog?.preferred_tier as DifficultyTier) || "medium";
  const weekIndex = Math.max(1, prog?.current_week_index ?? 1);
  const week = weekForIndex(def, weekIndex);
  if (!week) throw new Error(`Geen week ${weekIndex} in dit protocol.`);

  const completedIds = new Set(
    Array.isArray(prog?.completed_task_ids)
      ? prog.completed_task_ids.filter((id): id is string => typeof id === "string")
      : []
  );
  const plannable = selectProtocolTasksForWeeklyMissions(week.tasks);
  const openTasks = plannable.filter((task) => !completedIds.has(task.id));
  if (openTasks.length === 0) {
    return { created: 0, skipped: 0, round: 1, taskIds: [], plannedTaskTitles: [] };
  }

  const { start: weekStart, end: weekEnd } = getBudgetWeekBounds(anchorToday);
  const { data: existingWeekRows } = await supabase
    .from("tasks")
    .select("task_tags")
    .eq("user_id", user.id)
    .gte("due_date", weekStart)
    .lte("due_date", weekEnd)
    .is("deleted_at", null);

  let highestRound = 0;
  for (const rowItem of existingWeekRows ?? []) {
    const tags = normalizeTaskTags((rowItem as { task_tags?: unknown }).task_tags);
    if (!tags.includes(CATCHUP_TAG)) continue;
    if (!tags.includes(`protocol_slug:${params.protocol_slug}`)) continue;
    if (!tags.includes(`protocol_locale:${locale}`)) continue;
    if (!tags.includes(`protocol_week:${weekIndex}`)) continue;
    const round = catchupRoundFromTags(tags);
    if (round && round > highestRound) highestRound = round;
  }
  const round = highestRound + 1;

  const maxTasks = Math.max(1, Math.min(3, Math.floor(params.max_tasks ?? 2)));
  const selectedTasks = [...openTasks]
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, maxTasks);
  const dueDates = assignProtocolTaskDueDatesFromWeek(selectedTasks, week, anchorToday);
  const titlePrefix = (row as { title?: string }).title?.slice(0, 48) ?? params.protocol_slug;

  const taskIds: string[] = [];
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < selectedTasks.length; i += 1) {
    const task = selectedTasks[i]!;
    const scaled = getScaledTask(task, tier);
    const dueDate = dueDates[i] ?? anchorToday;
    const notes = [
      `[Catch-up ronde ${round}] ${scaled.concrete}`,
      task.success_criteria ? `Succescriterium: ${task.success_criteria}` : null,
      "",
      "---",
      `protocol:${params.protocol_slug}`,
      PTASK_MARKER(task.id),
      `week:${weekIndex}`,
      `tier:${tier}`,
      `catchup_round:${round}`,
    ]
      .filter((line): line is string => !!line)
      .join("\n");

    try {
      const result = await createTask({
        title: `${titlePrefix} · Catch-up · ${task.title}`.slice(0, 200),
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
          CATCHUP_TAG,
          params.protocol_slug,
          `protocol_slug:${params.protocol_slug}`,
          `protocol_locale:${locale}`,
          `protocol_week:${weekIndex}`,
          `protocol_task:${task.id}`,
          `protocol_tier:${tier}`,
          `${CATCHUP_ROUND_TAG}${round}`,
        ],
      });
      if (result.id) {
        taskIds.push(result.id);
        created += 1;
      } else {
        skipped += 1;
      }
    } catch {
      skipped += 1;
    }
  }

  revalidatePath("/learning");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return {
    created,
    skipped,
    round,
    taskIds,
    plannedTaskTitles: selectedTasks.map((task) => task.title),
  };
}
