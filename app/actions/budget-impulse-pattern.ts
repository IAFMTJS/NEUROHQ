"use server";

import { createClient } from "@/lib/supabase/server";

/** Detects the dominant impulse spending window (e.g. "19:00–22:00") over the last 30 days. */
export async function getImpulseTimeWindow(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceStr = since.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("budget_entries")
      .select("amount_cents, is_planned, note, created_at")
      .eq("user_id", user.id)
      .lt("amount_cents", 0)
      .gte("created_at", sinceStr + "T00:00:00Z");
    if (error || !data) return null;

    const rows = data as {
      amount_cents: number;
      is_planned?: boolean | null;
      note?: string | null;
      created_at?: string | null;
    }[];

    const impulseRows = rows.filter((r) => {
      const isImpulseNote = (r.note ?? "").toLowerCase().includes("impulse");
      const isUnplanned = r.is_planned === false;
      return isImpulseNote || isUnplanned;
    });
    if (impulseRows.length < 3) return null;

    const buckets: Record<number, number> = {};
    for (const r of impulseRows) {
      if (!r.created_at) continue;
      const h = new Date(r.created_at).getHours();
      const bucket = Math.floor(h / 3) * 3; // 3-hour buckets: 0–3, 3–6, ...
      buckets[bucket] = (buckets[bucket] ?? 0) + 1;
    }

    const entries = Object.entries(buckets);
    if (!entries.length) return null;
    const [startHourStr] = entries.sort((a, b) => b[1] - a[1])[0];
    const startHour = parseInt(startHourStr, 10);
    const endHour = Math.min(24, startHour + 3);

    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(startHour)}:00–${pad(endHour)}:00`;
  } catch {
    return null;
  }
}

