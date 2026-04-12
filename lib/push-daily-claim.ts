import type { SupabaseClient } from "@supabase/supabase-js";
import { utcStartOfLocalDayIso } from "@/lib/utils/timezone";

/** Orphan claims older than this with no matching push_sends_log row are cleared so a later run can retry. */
const STALE_CLAIM_MS = 30 * 60 * 1000;

/**
 * If there is a claim row but no successful send logged for this local day, and the claim is stale,
 * remove it (e.g. worker crashed after insert). Does nothing when a send is already logged for the day.
 */
export async function cleanupStaleDailyPushClaim(
  supabase: SupabaseClient,
  userId: string,
  triggerType: string,
  localDateYyyyMmDd: string,
  timezone: string | null
): Promise<void> {
  const sinceIso =
    timezone && timezone.trim()
      ? utcStartOfLocalDayIso(timezone, localDateYyyyMmDd)
      : `${localDateYyyyMmDd}T00:00:00.000Z`;
  const { count } = await supabase
    .from("push_sends_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("trigger_type", triggerType)
    .gte("sent_at", sinceIso);
  if ((count ?? 0) > 0) return;

  const { data: claim } = await supabase
    .from("push_daily_push_claims")
    .select("created_at")
    .eq("user_id", userId)
    .eq("local_date", localDateYyyyMmDd)
    .eq("trigger_type", triggerType)
    .maybeSingle();
  if (!claim) return;
  const createdMs = new Date((claim as { created_at: string }).created_at).getTime();
  if (Date.now() - createdMs < STALE_CLAIM_MS) return;

  await supabase
    .from("push_daily_push_claims")
    .delete()
    .eq("user_id", userId)
    .eq("local_date", localDateYyyyMmDd)
    .eq("trigger_type", triggerType);
}

/**
 * Atomically reserve the right to send this daily push. Returns false if another worker already claimed or sent.
 */
export async function tryClaimDailyPushSend(
  supabase: SupabaseClient,
  userId: string,
  triggerType: string,
  localDateYyyyMmDd: string
): Promise<boolean> {
  const { error } = await supabase.from("push_daily_push_claims").insert({
    user_id: userId,
    local_date: localDateYyyyMmDd,
    trigger_type: triggerType,
  });
  if (!error) return true;
  // Unique violation: another worker or prior claim for this (user, day, trigger).
  if ((error as { code?: string }).code === "23505") return false;
  // Missing migration, RLS, or transient DB errors — do not fail the whole hourly cron.
  console.error(
    "[push-daily-claim] insert failed",
    (error as { code?: string }).code,
    (error as { message?: string }).message
  );
  return false;
}

/** Release claim so another hour can retry (send failed) or drop after success (row no longer needed). */
export async function deleteDailyPushClaim(
  supabase: SupabaseClient,
  userId: string,
  triggerType: string,
  localDateYyyyMmDd: string
): Promise<void> {
  await supabase
    .from("push_daily_push_claims")
    .delete()
    .eq("user_id", userId)
    .eq("local_date", localDateYyyyMmDd)
    .eq("trigger_type", triggerType);
}
