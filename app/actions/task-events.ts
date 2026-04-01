"use server";

import { createClient } from "@/lib/supabase/server";

/** Log task lifecycle event for completion rate, resistance index, ROI (Performance Engine). */
export async function logTaskEvent(params: {
  taskId: string;
  eventType: "view" | "start" | "complete" | "abandon";
  durationBeforeStartSeconds?: number | null;
  durationToCompleteSeconds?: number | null;
  /** Fase 3: 0–100 completion quality score. */
  performanceScore?: number | null;
  /** Fase 3: S/A/B/C rank. */
  performanceRank?: "S" | "A" | "B" | "C" | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("task_events").insert({
    user_id: user.id,
    task_id: params.taskId,
    event_type: params.eventType,
    duration_before_start_seconds: params.durationBeforeStartSeconds ?? null,
    duration_to_complete_seconds: params.durationToCompleteSeconds ?? null,
    performance_score: params.performanceScore ?? null,
    performance_rank: params.performanceRank ?? null,
  });
}
