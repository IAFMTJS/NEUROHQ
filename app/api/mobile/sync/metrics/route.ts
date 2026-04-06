import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type MetricsPayload = {
  outboxDepth?: number;
  syncSuccessCount?: number;
  syncFailureCount?: number;
  syncConflictCount?: number;
  staleReadCount?: number;
  freshReadCount?: number;
  updatedAt?: number;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: MetricsPayload;
  try {
    body = (await request.json()) as MetricsPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = {
    outboxDepth: Number(body.outboxDepth ?? 0),
    syncSuccessCount: Number(body.syncSuccessCount ?? 0),
    syncFailureCount: Number(body.syncFailureCount ?? 0),
    syncConflictCount: Number(body.syncConflictCount ?? 0),
    staleReadCount: Number(body.staleReadCount ?? 0),
    freshReadCount: Number(body.freshReadCount ?? 0),
    updatedAt: Number(body.updatedAt ?? Date.now()),
  };

  await supabase.from("user_actions_audit").insert({
    user_id: user.id,
    action_type: "mobile_sync_metrics",
    payload,
  } as never);

  return NextResponse.json({ ok: true });
}

