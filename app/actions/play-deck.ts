"use server";

import { createClient } from "@/lib/supabase/server";
import { createTask } from "@/app/actions/tasks";
import { getPlayProfileDocument, updatePlayProfileDocument } from "@/app/actions/play-profile";
import { baseXpForLevel } from "@/lib/mission-templates";
import { scorePlayTemplates, getPlayTemplateById } from "@/lib/play-deck/score-play-templates";
import type { PlayDeckTemplate } from "@/lib/play-deck/types";
import type { PlayProfileDocument } from "@/types/play-profile.types";

export type PlayDeckSuggestion = Pick<PlayDeckTemplate, "id" | "title" | "play_kind" | "energy">;

/** Volledig deck: expliciete vlag óf genoeg play-profiel voor betere matching. */
function isPlayDeckFullyUnlocked(doc: PlayProfileDocument): boolean {
  if (doc.data.play_deck_unlocked_full === true) return true;
  const styles = Array.isArray(doc.data.fun_styles) ? doc.data.fun_styles.filter((s) => typeof s === "string" && s.trim()).length : 0;
  const about = typeof doc.data.about_you === "string" ? doc.data.about_you.trim().length : 0;
  const er = doc.data.energy_recharge;
  const rechargeSet = typeof er === "string" && er.trim().length > 0;
  if (styles >= 1) return true;
  if (about >= 28) return true;
  if (rechargeSet) return true;
  return false;
}

export async function suggestPlayDeckTasks(params: {
  dateStr: string;
  cursor?: number;
  limit?: number;
}): Promise<{ suggestions: PlayDeckSuggestion[]; fullDeckUnlocked: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { suggestions: [], fullDeckUnlocked: false };

  const doc = await getPlayProfileDocument();
  const fullDeckUnlocked = isPlayDeckFullyUnlocked(doc);

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

  const cursor = fullDeckUnlocked ? Math.max(0, params.cursor ?? 0) : 0;
  const seed = `${params.dateStr}|${cursor}`;
  const templates = scorePlayTemplates(doc, titles, {
    seed,
    limit: fullDeckUnlocked ? params.limit ?? 8 : 3,
    cursor,
    starterOnly: !fullDeckUnlocked,
  });

  return {
    fullDeckUnlocked,
    suggestions: templates.map((t) => ({
      id: t.id,
      title: t.title,
      play_kind: t.play_kind,
      energy: t.energy,
    })),
  };
}

/** Handmatig volledig play deck tonen (zonder profiel). */
export async function unlockPlayDeckFull(): Promise<{ ok: true } | { ok: false; error: string }> {
  const doc = await getPlayProfileDocument();
  if (doc.data.play_deck_unlocked_full === true) return { ok: true };
  return await updatePlayProfileDocument({
    schemaVersion: doc.schemaVersion,
    data: { ...doc.data, play_deck_unlocked_full: true },
  });
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
      // Match normal missions for performance rank + XP: low template energy → mid band (5–7)
      // so energy/focus vs daily check-in is not structurally penalized.
      const energyRequired = t.energy === 1 ? 5 : t.energy === 2 ? 6 : 7;
      const focusRequired = energyRequired;
      const mentalLoad = t.energy === 1 ? 4 : t.energy === 2 ? 5 : 6;
      // Same scale as mission templates / baseXpForLevel (50 normaal, 100 veel; 75 mid tier).
      const baseXp =
        t.spice === "high"
          ? baseXpForLevel("high")
          : t.spice === "medium"
            ? 75
            : baseXpForLevel("normal");

      await createTask({
        title: t.title,
        due_date: params.dateStr,
        category: "personal",
        energy_required: energyRequired,
        focus_required: focusRequired,
        mental_load: mentalLoad,
        social_load: t.tags.includes("social_light") ? 4 : 2,
        task_type: t.play_kind === "unwind" ? "recovery" : "mixed",
        mission_intent: t.play_kind === "unwind" ? "recovery" : "experiment",
        base_xp: baseXp,
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
