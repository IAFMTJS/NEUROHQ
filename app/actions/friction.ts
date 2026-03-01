"use server";

import { createClient } from "@/lib/supabase/server";

export interface FrictionSignal {
  type: "opened_not_started" | "started_not_completed" | "postponed";
  count: number;
  message: string;
  suggestMicroTask: boolean;
}

/** Detect resistance: opened but not started, started not completed, postponed. */
export async function getFrictionSignals(): Promise<FrictionSignal[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabase
    .from("friction_events")
    .select("event_type")
    .eq("user_id", user.id)
    .gte("created_at", sevenDaysAgo);

  const counts = { opened_not_started: 0, started_not_completed: 0, postponed: 0 };
  for (const e of events ?? []) {
    const t = e.event_type as keyof typeof counts;
    if (t in counts) counts[t]++;
  }

  const signals: FrictionSignal[] = [];
  const threshold = 3;

  if (counts.opened_not_started >= threshold) {
    signals.push({
      type: "opened_not_started",
      count: counts.opened_not_started,
      message: "Resistance detected: missies geopend maar niet gestart.",
      suggestMicroTask: true,
    });
  }
  if (counts.started_not_completed >= threshold) {
    signals.push({
      type: "started_not_completed",
      count: counts.started_not_completed,
      message: "Meerdere missies gestart maar niet afgerond.",
      suggestMicroTask: true,
    });
  }
  if (counts.postponed >= threshold) {
    signals.push({
      type: "postponed",
      count: counts.postponed,
      message: "Taken vaak uitgesteld. Wil je opdelen in kleine stappen?",
      suggestMicroTask: true,
    });
  }

  return signals;
}

/** Record a friction event (call when user opens task but doesn't start, or postpones). */
export async function recordFrictionEvent(params: {
  eventType: "opened_not_started" | "started_not_completed" | "postponed";
  taskId?: string | null;
  missionId?: string | null;
  openedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  delayMinutes?: number | null;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("friction_events").insert({
    user_id: user.id,
    task_id: params.taskId ?? null,
    mission_id: params.missionId ?? null,
    event_type: params.eventType,
    opened_at: params.openedAt ?? null,
    started_at: params.startedAt ?? null,
    completed_at: params.completedAt ?? null,
    delay_minutes: params.delayMinutes ?? null,
  });
}
