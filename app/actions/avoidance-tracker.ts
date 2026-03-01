"use server";

import { createClient } from "@/lib/supabase/server";

export type AvoidanceTag = string;

export type AvoidanceStats = {
  skipped: number;
  completed: number;
  lastForcedAt?: string | null;
  lastForcedLevel?: 1 | 2 | 3 | null;
};

export type AvoidanceTracker = Record<AvoidanceTag, AvoidanceStats>;

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getAvoidanceTracker(): Promise<AvoidanceTracker> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId) return {};

  const { data } = await supabase
    .from("avoidance_tracker")
    .select("tag, skipped, completed, last_forced_at, last_forced_level")
    .eq("user_id", userId);

  const result: AvoidanceTracker = {};
  for (const row of data ?? []) {
    const r = row as { tag: string; skipped: number | null; completed: number | null; last_forced_at?: string | null; last_forced_level?: number | null };
    result[r.tag] = {
      skipped: r.skipped ?? 0,
      completed: r.completed ?? 0,
      lastForcedAt: r.last_forced_at ?? null,
      lastForcedLevel: (r.last_forced_level as 1 | 2 | 3 | null) ?? null,
    };
  }
  return result;
}

export async function incrementAvoidanceSkip(tag: AvoidanceTag): Promise<void> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId || !tag) return;

  const { data, error } = await supabase
    .from("avoidance_tracker")
    .select("skipped")
    .eq("user_id", userId)
    .eq("tag", tag)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("incrementAvoidanceSkip(select):", error.message);
  }

  const currentSkipped =
    (data as { skipped?: number | null } | null)?.skipped ?? 0;

  const { error: upsertError } = await supabase
    .from("avoidance_tracker")
    .upsert(
      {
        user_id: userId,
        tag,
        skipped: currentSkipped + 1,
        completed: 0,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,tag",
      }
    );

  if (upsertError) {
    console.error("incrementAvoidanceSkip(upsert):", upsertError.message);
  }
}

export async function recordAvoidanceCompletion(tag: AvoidanceTag): Promise<void> {
  const supabase = await createClient();
  const userId = await getUserId();
  if (!userId || !tag) return;

  const { data, error } = await supabase
    .from("avoidance_tracker")
    .select("skipped, completed")
    .eq("user_id", userId)
    .eq("tag", tag)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("recordAvoidanceCompletion(select):", error.message);
    return;
  }

  const current = (data as { skipped?: number | null; completed?: number | null } | null) ?? null;
  const newCompleted = (current?.completed ?? 0) + 1;

  const { error: upsertError } = await supabase.from("avoidance_tracker").upsert(
    {
      user_id: userId,
      tag,
      skipped: 0,
      completed: newCompleted,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,tag",
    }
  );

  if (upsertError) {
    console.error("recordAvoidanceCompletion(upsert):", upsertError.message);
  }
}

