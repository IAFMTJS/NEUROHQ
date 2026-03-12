import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

/**
 * Send a real server-side push notification to the current user.
 * This goes through VAPID + APNs, so it should arrive even when the PWA is closed
 * (as long as the user has an active push subscription and the device allows notifications).
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Push is not configured on the server (missing VAPID keys)." },
        { status: 500 }
      );
    }

    const admin = createAdminClient();

    const ok = await sendPushToUser(admin, user.id, {
      title: "NEUROHQ · Server push test",
      body: "This came from the server via APNs. It should appear even when the PWA is closed.",
      tag: "server-push-test",
      url: "/dashboard",
      priority: "high",
    });

    if (!ok) {
      return NextResponse.json(
        {
          error:
            "Push subscription missing or invalid for this user. Try reconnecting push in Settings and then test again.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send server push test.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

