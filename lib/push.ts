import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLocalDateHour } from "@/lib/utils/timezone";

// Daily limits to avoid overwhelming users while allowing richer scenarios.
// High-priority pushes (e.g. critical reminders) are capped by MAX_PUSH_PER_DAY.
// Low-priority pushes stop earlier so they don't crowd out important ones.
const MAX_PUSH_PER_DAY = 12;
const MAX_PUSH_BEFORE_LOW_PRIORITY_BLOCK = 8;
/** When user has zero opens-from-push in last 7 days, cap at this to reduce fatigue. */
const MAX_PUSH_PER_DAY_LOW_ENGAGEMENT = 9;

export type PushPayload = {
  title: string;
  body?: string;
  tag?: string;
  url?: string;
  priority?: "low" | "normal" | "high";
};

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails("mailto:support@neurohq.app", publicKey, privateKey);
  vapidConfigured = true;
}

/** Append from_push=1 and tag to payload.url so client can report click. */
function urlWithClickTracking(url: string | undefined, tag: string | undefined): string | undefined {
  if (!url) return url;
  const base = url.startsWith("/") ? url : `/${url.replace(/^\//, "")}`;
  const sep = base.includes("?") ? "&" : "?";
  const params = new URLSearchParams();
  params.set("from_push", "1");
  if (tag) params.set("tag", tag);
  return `${base}${sep}${params.toString()}`;
}

/**
 * Send one push to a user's stored subscription.
 * - "Today" for the daily cap is user's local date (timezone); resets at their midnight.
 * - When user has zero opens-from-push in last 7 days, cap is reduced (fatigue).
 * - Logs send to push_sends_log for re-engagement backoff.
 * - Appends from_push & tag to payload.url for click tracking.
 */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<boolean> {
  ensureVapid();

  const { data: user } = await supabase
    .from("users")
    .select("push_subscription_json, push_sent_count, push_sent_date, timezone")
    .eq("id", userId)
    .single();

  if (!user?.push_subscription_json || typeof user.push_subscription_json !== "object") return false;

  const tz = (user.timezone as string | null) ?? null;
  const userToday = tz ? getLocalDateHour(tz).date : new Date().toISOString().slice(0, 10);
  let count = (user.push_sent_count ?? 0) as number;
  const lastDate = (user.push_sent_date as string) ?? null;

  if (lastDate !== userToday) {
    count = 0;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: clicksLast7d } = await supabase
    .from("push_engagement")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "clicked")
    .gte("created_at", sevenDaysAgo);
  const effectiveMax =
    (clicksLast7d ?? 0) >= 1 ? MAX_PUSH_PER_DAY : MAX_PUSH_PER_DAY_LOW_ENGAGEMENT;

  if ((payload.priority ?? "normal") === "low" && count >= MAX_PUSH_BEFORE_LOW_PRIORITY_BLOCK) return false;
  if (count >= effectiveMax) return false;

  const payloadToSend = {
    ...payload,
    url: urlWithClickTracking(payload.url, payload.tag),
  };

  try {
    await webpush.sendNotification(
      user.push_subscription_json as webpush.PushSubscription,
      JSON.stringify(payloadToSend)
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
      push_sent_date: userToday,
    })
    .eq("id", userId);

  await supabase.from("push_sends_log").insert({
    user_id: userId,
    trigger_type: payload.tag ?? "unknown",
    sent_at: new Date().toISOString(),
  });

  return true;
}
