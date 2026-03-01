"use server";

import { createAdminClient } from "@/lib/supabase/admin";

type HobbyKey = "fitness" | "music" | "language" | "creative";

const HOBBY_KEYS: HobbyKey[] = ["fitness", "music", "language", "creative"];

/** Days without a completed hobby mission before we decay commitment (see ACTIEPLAN spec: 5 dagen). */
const DECAY_THRESHOLD_DAYS = 5;
/** Multiplicative decay per day over threshold. E.g. 0.9 = -10%, min 0. */
const DECAY_FACTOR = 0.9;

export async function runDailyHobbyCommitmentDecay(): Promise<{ usersScanned: number; usersUpdated: number }> {
  const supabase = createAdminClient();
  const today = new Date();

  const { data: profiles } = await supabase
    .from("behavior_profile")
    .select("user_id, hobby_commitment");

  const rows = (profiles ?? []) as { user_id: string; hobby_commitment: Record<string, number> | null }[];
  let usersUpdated = 0;

  for (const row of rows) {
    const current = row.hobby_commitment && typeof row.hobby_commitment === "object" ? row.hobby_commitment : null;
    if (!current) continue;

    // Fetch last completed hobby missions for this user (any hobby_tag).
    const { data: hobbyTasks } = await supabase
      .from("tasks")
      .select("hobby_tag, due_date")
      .eq("user_id", row.user_id)
      .eq("completed", true)
      .not("hobby_tag", "is", null);

    const lastByHobby = new Map<HobbyKey, string>();
    for (const t of hobbyTasks ?? []) {
      const tag = (t as { hobby_tag?: HobbyKey | null }).hobby_tag ?? null;
      const due = (t as { due_date?: string | null }).due_date ?? null;
      if (!tag || !due || !HOBBY_KEYS.includes(tag)) continue;
      const prev = lastByHobby.get(tag);
      if (!prev || due > prev) {
        lastByHobby.set(tag, due);
      }
    }

    let changed = false;
    const next: Record<string, number> = { ...current };

    for (const key of HOBBY_KEYS) {
      const value = typeof current[key] === "number" ? (current[key] as number) : null;
      if (value == null || value <= 0) continue;

      const lastStr = lastByHobby.get(key);
      if (!lastStr) {
        // No completed hobby missions for this tag yet → let intent stand for now.
        continue;
      }

      const last = new Date(lastStr + "T12:00:00Z");
      const diffMs = today.getTime() - last.getTime();
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (days > DECAY_THRESHOLD_DAYS) {
        const decayed = Math.max(0, Math.round(value * DECAY_FACTOR * 10) / 10);
        if (decayed !== value) {
          next[key] = decayed;
          changed = true;
        }
      }
    }

    if (!changed) continue;

    const { error } = await supabase
      .from("behavior_profile")
      .update({
        hobby_commitment: next,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", row.user_id);

    if (!error) {
      usersUpdated++;
    }
  }

  return { usersScanned: rows.length, usersUpdated };
}

