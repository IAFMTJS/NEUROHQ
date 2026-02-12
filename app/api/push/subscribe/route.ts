import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Save Web Push subscription for the current user.
 * Body: { subscription: PushSubscriptionJSON }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const subscription = body.subscription;
  if (!subscription || typeof subscription !== "object") {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ push_subscription_json: subscription })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
