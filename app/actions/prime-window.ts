"use server";

import { createClient } from "@/lib/supabase/server";

export interface PrimeWindow {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  active: boolean;
}

/** Compute prime window from last 14 days completion times (peak 2h window). Returns local time strings HH:mm. */
export async function computeAndStorePrimeWindow(): Promise<PrimeWindow | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const startStr = fourteenDaysAgo.toISOString().slice(0, 10);

  const { data: taskCompletes } = await supabase
    .from("task_events")
    .select("occurred_at")
    .eq("user_id", user.id)
    .eq("event_type", "complete")
    .gte("occurred_at", startStr + "T00:00:00Z");

  const { data: behaviourCompletes } = await supabase
    .from("behaviour_log")
    .select("mission_completed_at")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .not("mission_completed_at", "is", null);

  const hours: number[] = [];
  for (const row of taskCompletes ?? []) {
    const t = (row as { occurred_at: string }).occurred_at;
    if (t) {
      const d = new Date(t);
      hours.push(d.getUTCHours() + d.getUTCMinutes() / 60);
    }
  }
  for (const row of behaviourCompletes ?? []) {
    const t = (row as { mission_completed_at: string }).mission_completed_at;
    if (t) {
      const d = new Date(t);
      hours.push(d.getUTCHours() + d.getUTCMinutes() / 60);
    }
  }

  if (hours.length < 3) {
    return { start: "09:00", end: "11:00", active: false };
  }

  const sorted = [...hours].sort((a, b) => a - b);
  let bestStart = 9;
  let bestCount = 0;
  const windowHours = 2;
  for (let h = 6; h <= 20; h += 0.5) {
    const count = sorted.filter((x) => x >= h && x < h + windowHours).length;
    if (count > bestCount) {
      bestCount = count;
      bestStart = h;
    }
  }
  const startHour = Math.floor(bestStart);
  const startMin = Math.round((bestStart % 1) * 60);
  const endHour = Math.floor(bestStart + windowHours);
  const endMin = Math.round(((bestStart + windowHours) % 1) * 60);

  const start = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
  const end = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

  await supabase.from("user_gamification").upsert(
    {
      user_id: user.id,
      prime_window_start: `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00`,
      prime_window_end: `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return { start, end, active: true };
}

/** Get stored prime window for current user (or compute if missing). */
export async function getPrimeWindow(): Promise<PrimeWindow> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { start: "09:00", end: "11:00", active: false };

  const { data: row } = await supabase
    .from("user_gamification")
    .select("prime_window_start, prime_window_end")
    .eq("user_id", user.id)
    .single();

  const r = row as { prime_window_start?: string | null; prime_window_end?: string | null } | null;
  if (r?.prime_window_start && r?.prime_window_end) {
    const toHHmm = (t: string) => {
      const parts = t.split(":");
      return `${parts[0]!.padStart(2, "0")}:${(parts[1] ?? "00").padStart(2, "0")}`;
    };
    return {
      start: toHHmm(r.prime_window_start),
      end: toHHmm(r.prime_window_end),
      active: true,
    };
  }
  const computed = await computeAndStorePrimeWindow();
  return computed ?? { start: "09:00", end: "11:00", active: false };
}

/** Check if current time (UTC) is inside user's prime window. Uses stored window in UTC-ish (stored as local; we compare with client/local or assume server UTC). */
export async function isInsidePrimeWindow(occurredAt?: Date): Promise<boolean> {
  const window = await getPrimeWindow();
  if (!window.active) return false;
  const d = occurredAt ?? new Date();
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60;
  const [startH, startM] = window.start.split(":").map(Number);
  const [endH, endM] = window.end.split(":").map(Number);
  const start = startH + (startM ?? 0) / 60;
  const end = endH + (endM ?? 0) / 60;
  if (start <= end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}
