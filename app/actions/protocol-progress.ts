"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";
import type { DifficultyTier } from "@/lib/growth/adaptive-engine";

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

export async function getProtocolProgressMap(): Promise<Record<string, ProtocolProgressState>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase.from("user_protocol_progress").select("*").eq("user_id", user.id);
  if (error || !data?.length) {
    if (error && process.env.NODE_ENV === "development") console.warn("user_protocol_progress:", error.message);
    return {};
  }

  const map: Record<string, ProtocolProgressState> = {};
  for (const row of data as UserProtocolProgressRow[]) {
    const key = `${row.protocol_slug}::${row.locale}`;
    map[key] = {
      protocol_slug: row.protocol_slug,
      locale: row.locale,
      preferred_tier: parseTier(row.preferred_tier),
      current_week_index: Math.max(1, row.current_week_index ?? 1),
      completed_task_ids: parseIds(row.completed_task_ids),
    };
  }
  return map;
}

type UpsertInput = {
  protocol_slug: string;
  locale?: string;
  preferred_tier?: DifficultyTier;
  current_week_index?: number;
  completed_task_ids?: string[];
};

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

  const { error } = await supabase.from("user_protocol_progress").upsert(merged as never, {
    onConflict: "user_id,protocol_slug,locale",
  });
  if (error) throw new Error(error.message);
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
  return { completed: !was };
}
