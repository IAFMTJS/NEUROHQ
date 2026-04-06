"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";
import {
  normalizeTaskTagsArray,
  parseProtocolProgressMetaFromTaskTags,
} from "@/lib/growth/protocol-task-tags";

export type UserProtocolProgressRow = Tables<"user_protocol_progress">;

export type ProtocolProgressState = {
  protocol_slug: string;
  locale: string;
  preferred_tier: DifficultyTier;
  current_week_index: number;
  completed_task_ids: string[];
};

function parseTier(s: string | null | undefined): DifficultyTier {
  if (s === "easy" || s === "hard" || s === "medium") return s;
  return "medium";
}

function parseIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

function progressKeyFromParts(protocol_slug: string, locale: string) {
  return `${protocol_slug}::${locale}`;
}

function parseProgressKey(key: string): { protocol_slug: string; locale: string } {
  const idx = key.indexOf("::");
  if (idx <= 0) return { protocol_slug: key, locale: "nl" };
  return { protocol_slug: key.slice(0, idx), locale: key.slice(idx + 2) };
}

/**
 * Merge stored progress with protocol missions on the Tasks board:
 * completed missions count as done; open missions for the same protocol_task id do not.
 */
async function mergeProtocolMissionCompletionsIntoMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  base: Record<string, ProtocolProgressState>,
): Promise<Record<string, ProtocolProgressState>> {
  let missionRows: { completed?: boolean; task_tags?: unknown }[] | null = null;
  /** JSON string: postgrest-js maps array args to `cs.{x}` (native array), invalid for jsonb — must use JSON. */
  const protocolTagFilter = JSON.stringify(["protocol"]);
  const filtered = await supabase
    .from("tasks")
    .select("completed, task_tags")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .contains("task_tags", protocolTagFilter);
  if (filtered.error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("protocol mission merge (contains filter):", filtered.error.message);
    }
    const fallback = await supabase
      .from("tasks")
      .select("completed, task_tags")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .not("task_tags", "is", null);
    missionRows = (fallback.data ?? []) as { completed?: boolean; task_tags?: unknown }[];
  } else {
    missionRows = (filtered.data ?? []) as { completed?: boolean; task_tags?: unknown }[];
  }

  type Bucket = { done: Set<string>; open: Set<string> };
  const buckets = new Map<string, Bucket>();

  for (const raw of missionRows ?? []) {
    const row = raw as { completed?: boolean; task_tags?: unknown };
    const meta = parseProtocolProgressMetaFromTaskTags(normalizeTaskTagsArray(row.task_tags));
    if (!meta) continue;
    const key = progressKeyFromParts(meta.protocol_slug, meta.locale);
    let b = buckets.get(key);
    if (!b) {
      b = { done: new Set(), open: new Set() };
      buckets.set(key, b);
    }
    if (row.completed) b.done.add(meta.protocol_task_id);
    else b.open.add(meta.protocol_task_id);
  }

  const keys = new Set<string>([...Object.keys(base), ...buckets.keys()]);
  const out: Record<string, ProtocolProgressState> = { ...base };

  for (const key of keys) {
    const { protocol_slug, locale } = parseProgressKey(key);
    const stored = base[key];
    const b = buckets.get(key) ?? { done: new Set<string>(), open: new Set<string>() };
    const S = new Set(stored?.completed_task_ids ?? []);

    const display = new Set<string>();
    for (const id of S) {
      if (!b.open.has(id)) display.add(id);
    }
    for (const id of b.done) {
      if (!b.open.has(id)) display.add(id);
    }
    const completed_task_ids = [...display];

    if (!stored && completed_task_ids.length === 0) continue;

    out[key] = {
      protocol_slug,
      locale,
      preferred_tier: stored?.preferred_tier ?? "medium",
      current_week_index: stored?.current_week_index ?? 1,
      completed_task_ids,
    };
  }

  return out;
}

export async function getProtocolProgressMap(): Promise<Record<string, ProtocolProgressState>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase.from("user_protocol_progress").select("*").eq("user_id", user.id);
  if (error) {
    if (process.env.NODE_ENV === "development") console.warn("user_protocol_progress:", error.message);
    return mergeProtocolMissionCompletionsIntoMap(supabase, user.id, {});
  }

  const map: Record<string, ProtocolProgressState> = {};
  for (const row of (data ?? []) as UserProtocolProgressRow[]) {
    const key = progressKeyFromParts(row.protocol_slug, row.locale);
    map[key] = {
      protocol_slug: row.protocol_slug,
      locale: row.locale,
      preferred_tier: parseTier(row.preferred_tier),
      current_week_index: Math.max(1, row.current_week_index ?? 1),
      completed_task_ids: parseIds(row.completed_task_ids),
    };
  }
  return mergeProtocolMissionCompletionsIntoMap(supabase, user.id, map);
}

export type ProtocolProgressUpsertInput = {
  protocol_slug: string;
  locale?: string;
  preferred_tier?: DifficultyTier;
  current_week_index?: number;
  completed_task_ids?: string[];
  /** Monday YYYY-MM-DD of the budget week aligned with current_week_index (Growth calendar roll). */
  growth_calendar_week_start?: string | null;
};

type UpsertInput = ProtocolProgressUpsertInput;

async function upsertProgress(userId: string, patch: UpsertInput) {
  const supabase = await createClient();
  const locale = patch.locale ?? "nl";
  const { data: existing } = await supabase
    .from("user_protocol_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("protocol_slug", patch.protocol_slug)
    .eq("locale", locale)
    .maybeSingle();

  const row = existing as UserProtocolProgressRow | null;
  const merged: Record<string, unknown> = {
    user_id: userId,
    protocol_slug: patch.protocol_slug,
    locale,
    preferred_tier: patch.preferred_tier ?? parseTier(row?.preferred_tier),
    current_week_index: patch.current_week_index ?? row?.current_week_index ?? 1,
    completed_task_ids: patch.completed_task_ids ?? parseIds(row?.completed_task_ids),
    updated_at: new Date().toISOString(),
  };
  if (patch.growth_calendar_week_start !== undefined) {
    merged.growth_calendar_week_start = patch.growth_calendar_week_start;
  }

  const { error } = await supabase.from("user_protocol_progress").upsert(merged as never, {
    onConflict: "user_id,protocol_slug,locale",
  });
  if (error) throw new Error(error.message);
}

/** Upsert a subset of protocol progress fields (used by Growth calendar sync + commit anchor). */
export async function upsertProtocolProgress(userId: string, patch: ProtocolProgressUpsertInput): Promise<void> {
  await upsertProgress(userId, patch);
}

export async function setProtocolPreferredTier(params: {
  protocol_slug: string;
  locale?: string;
  tier: DifficultyTier;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await upsertProgress(user.id, {
    protocol_slug: params.protocol_slug,
    locale: params.locale,
    preferred_tier: params.tier,
  });
  revalidatePath("/learning");
  revalidatePath("/strategy");
}

export async function setProtocolCurrentWeek(params: {
  protocol_slug: string;
  locale?: string;
  week_index: number;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await upsertProgress(user.id, {
    protocol_slug: params.protocol_slug,
    locale: params.locale,
    current_week_index: Math.max(1, Math.floor(params.week_index)),
  });
  revalidatePath("/learning");
  revalidatePath("/strategy");
}

export async function toggleProtocolTaskCompleted(params: {
  protocol_slug: string;
  locale?: string;
  task_id: string;
}): Promise<{ completed: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const locale = params.locale ?? "nl";

  const { data: existing } = await supabase
    .from("user_protocol_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("protocol_slug", params.protocol_slug)
    .eq("locale", locale)
    .maybeSingle();

  const row = existing as UserProtocolProgressRow | null;
  const ids = new Set(parseIds(row?.completed_task_ids));
  const was = ids.has(params.task_id);
  if (was) ids.delete(params.task_id);
  else ids.add(params.task_id);

  await upsertProgress(user.id, {
    protocol_slug: params.protocol_slug,
    locale,
    completed_task_ids: Array.from(ids),
    preferred_tier: parseTier(row?.preferred_tier),
    current_week_index: row?.current_week_index ?? 1,
  });
  revalidatePath("/learning");
  revalidatePath("/strategy");
  return { completed: !was };
}

/**
 * Sync Growth protocol progress when a protocol-linked mission is completed or uncompleted on the Tasks board.
 */
export async function applyProtocolProgressFromMissionTags(
  userId: string,
  taskTags: string[] | null | undefined,
  direction: "complete" | "uncomplete",
): Promise<void> {
  const meta = parseProtocolProgressMetaFromTaskTags(normalizeTaskTagsArray(taskTags));
  if (!meta) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("user_protocol_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("protocol_slug", meta.protocol_slug)
    .eq("locale", meta.locale)
    .maybeSingle();

  const row = existing as UserProtocolProgressRow | null;
  if (direction === "uncomplete" && !row) return;

  const ids = new Set(parseIds(row?.completed_task_ids));
  if (direction === "complete") {
    ids.add(meta.protocol_task_id);
  } else {
    ids.delete(meta.protocol_task_id);
  }

  await upsertProgress(userId, {
    protocol_slug: meta.protocol_slug,
    locale: meta.locale,
    completed_task_ids: Array.from(ids),
    preferred_tier: parseTier(row?.preferred_tier),
    current_week_index: row?.current_week_index ?? 1,
  });

  revalidatePath("/learning");
  revalidatePath("/strategy");
}
