import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_PUSH_PER_DAY = 3;

export type PushPayload = { title: string; body?: string; tag?: string; url?: string };

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails("mailto:support@neurohq.app", publicKey, privateKey);
  vapidConfigured = true;
}

/**
 * Send one push to a user's stored subscription. Respects max 3/day.
 * Caller must pass admin supabase and ensure user has push_subscription_json.
 */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<boolean> {
  ensureVapid();

  const { data: user } = await supabase
    .from("users")
    .select("push_subscription_json, push_sent_count, push_sent_date")
    .eq("id", userId)
    .single();

  if (!user?.push_subscription_json || typeof user.push_subscription_json !== "object") return false;

  const today = new Date().toISOString().slice(0, 10);
  let count = (user.push_sent_count ?? 0) as number;
  const lastDate = (user.push_sent_date as string) ?? null;

  if (lastDate !== today) {
    count = 0;
  }
  if (count >= MAX_PUSH_PER_DAY) return false;

  try {
    await webpush.sendNotification(
      user.push_subscription_json as webpush.PushSubscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err && (err.statusCode === 410 || err.statusCode === 404)) {
      await supabase.from("users").update({ push_subscription_json: null }).eq("id", userId);
    }
    return false;
  }

  await supabase
    .from("users")
    .update({
      push_sent_count: count + 1,
      push_sent_date: today,
    })
    .eq("id", userId);

  return true;
}
