"use server";

import { createClient } from "@/lib/supabase/server";
import { createTask } from "@/app/actions/tasks";
import { getPlayProfileDocument, updatePlayProfileDocument } from "@/app/actions/play-profile";
import { scorePlayTemplates, getPlayTemplateById } from "@/lib/play-deck/score-play-templates";
import type { PlayDeckTemplate } from "@/lib/play-deck/types";

export type PlayDeckSuggestion = Pick<PlayDeckTemplate, "id" | "title" | "play_kind" | "energy">;

export async function suggestPlayDeckTasks(params: {
  dateStr: string;
  cursor?: number;
  limit?: number;
}): Promise<{ suggestions: PlayDeckSuggestion[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { suggestions: [] };

  const doc = await getPlayProfileDocument();

  const { data: rows } = await supabase
    .from("tasks")
    .select("title")
    .eq("user_id", user.id)
    .eq("due_date", params.dateStr)
    .eq("completed", false)
    .is("deleted_at", null)
    .is("parent_task_id", null);

  const titles = (rows ?? [])
    .map((r) => (typeof (r as { title?: string }).title === "string" ? (r as { title: string }).title : ""))
    .filter(Boolean);

  const seed = `${params.dateStr}|${params.cursor ?? 0}`;
  const templates = scorePlayTemplates(doc, titles, {
    seed,
    limit: params.limit ?? 8,
    cursor: params.cursor ?? 0,
  });

  return {
    suggestions: templates.map((t) => ({
      id: t.id,
      title: t.title,
      play_kind: t.play_kind,
      energy: t.energy,
    })),
  };
}

export async function addPlayDeckTasksForToday(params: {
  dateStr: string;
  templateIds: string[];
}): Promise<{ created: number; errors: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { created: 0, errors: ["Niet ingelogd."] };

  const ids = [...new Set(params.templateIds.filter(Boolean))];
  const errors: string[] = [];
  let created = 0;

  for (const id of ids) {
    const t = getPlayTemplateById(id);
    if (!t) {
      errors.push(`Onbekend idee: ${id}`);
      continue;
    }
    try {
      await createTask({
        title: t.title,
        due_date: params.dateStr,
        category: "personal",
        energy_required: t.energy,
        focus_required: Math.min(4, t.energy + 1),
        mental_load: Math.min(4, t.energy + 1),
        social_load: t.tags.includes("social_light") ? 4 : 2,
        task_type: t.play_kind === "unwind" ? "recovery" : "mixed",
        mission_intent: t.play_kind === "unwind" ? "recovery" : "experiment",
        base_xp: 6,
        play_kind: t.play_kind,
        task_tags: ["play_deck"],
      });
      created++;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Taak kon niet worden toegevoegd.");
    }
  }

  return { created, errors };
}

/** Optional: import a large JSON blob into play_profile.data (merge top-level keys). */
export async function mergePlayProfileDataJson(params: {
  jsonText: string;
  replace?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(params.jsonText);
  } catch {
    return { ok: false, error: "Geen geldige JSON." };
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "JSON moet een object zijn." };
  }

  const doc = await getPlayProfileDocument();
  const nextData = params.replace
    ? { ...(parsed as Record<string, unknown>) }
    : { ...doc.data, ...(parsed as Record<string, unknown>) };

  return await updatePlayProfileDocument({
    schemaVersion: doc.schemaVersion,
    data: nextData,
  });
}
