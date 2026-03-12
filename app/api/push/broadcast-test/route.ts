import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import {
  buildBehavioralNotificationForContext,
  type BehaviorEvent,
  type UserNotificationContext,
} from "@/lib/behavioral-notifications";

/**
 * Admin-only endpoint to broadcast a one-off test push notification
 * to all users who currently have a valid push subscription.
 *
 * This is intended as a manual smoke test to verify that the push
 * infrastructure + device delivery are working end-to-end, without
 * requiring users to trigger any specific behavior in the app.
 *
 * Protection:
 * - Requires ADMIN_PUSH_BROADCAST_SECRET to be set in the environment.
 * - Caller must send the same value in the `x-admin-secret` header.
 */
export async function POST(request: Request) {
  const secret = process.env.ADMIN_PUSH_BROADCAST_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_PUSH_BROADCAST_SECRET is not configured on the server." },
      { status: 500 }
    );
  }

  const headerSecret = request.headers.get("x-admin-secret");
  if (!headerSecret || headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Find all users who currently have a push subscription.
    const { data: users, error } = await supabase
      .from("users")
      .select("id, push_subscription_json")
      .not("push_subscription_json", "is", null);

    if (error) {
      return NextResponse.json(
        { error: "Failed to load users with push subscriptions.", details: error.message },
        { status: 500 }
      );
    }

    const list = users ?? [];
    if (!list.length) {
      return NextResponse.json({ ok: true, attempted: 0, sent: 0, message: "No users with push subscriptions found." });
    }

    // Use the behavioral engine to generate a realistic notification payload,
    // but make it explicit that this is a one-off system test.
    const ctx: UserNotificationContext = {
      consistencyScore: 50,
      personalityMode: "auto",
    };

    const event: BehaviorEvent = {
      type: "inactivity_window",
      daysInactive: 1,
    };

    const engineResult = buildBehavioralNotificationForContext(ctx, event);
    if (!engineResult) {
      return NextResponse.json(
        { error: "Behavioral notification engine returned no payload for the test event." },
        { status: 500 }
      );
    }

    const basePayload = engineResult.payload;
    const payload = {
      ...basePayload,
      title: "NEUROHQ · Push system test",
      body: `${basePayload.body ?? ""}\n\n(This is a one-off NEUROHQ system test notification.)`.trim(),
      tag: "behavioral-system-test",
    };

    let attempted = 0;
    let sent = 0;

    for (const user of list as { id: string }[]) {
      attempted += 1;
      const ok = await sendPushToUser(supabase, user.id, payload);
      if (ok) sent += 1;
    }

    return NextResponse.json({
      ok: true,
      attempted,
      sent,
      skipped: attempted - sent,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error while broadcasting push test.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

