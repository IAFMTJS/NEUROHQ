import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type SyncPayload = {
  xp_gained?: unknown;
  client_date?: unknown;
};

type BrainSyncRow = {
  accepted_xp: number;
  total_xp: number;
  xp_today: number;
  server_date: string;
};

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeXpGained(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const asInt = Math.floor(value);
  if (asInt < 0) return null;
  if (asInt > 1000) return null;
  return asInt;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SyncPayload;
  try {
    body = (await request.json()) as SyncPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const xpGained = normalizeXpGained(body.xp_gained);
  if (xpGained == null) {
    return NextResponse.json({ error: "Invalid xp_gained. Expected integer 0..1000." }, { status: 400 });
  }

  if (!isDateKey(body.client_date)) {
    return NextResponse.json({ error: "Invalid client_date. Expected YYYY-MM-DD." }, { status: 400 });
  }

  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  };

  const { data, error } = await rpcClient.rpc("apply_brain_xp_sync", {
    p_client_date: body.client_date,
    p_requested_xp: xpGained,
  });

  if (error) {
    return NextResponse.json({ error: error.message ?? "Failed to sync brain XP." }, { status: 500 });
  }

  const row = (Array.isArray(data) ? data[0] : data) as BrainSyncRow | undefined;
  if (!row) {
    return NextResponse.json({ error: "Missing sync response row." }, { status: 500 });
  }

  return NextResponse.json(
    {
      accepted_xp: Math.max(0, Math.floor(row.accepted_xp ?? 0)),
      total_xp: Math.max(0, Math.floor(row.total_xp ?? 0)),
      xp_today: Math.max(0, Math.floor(row.xp_today ?? 0)),
      server_date: row.server_date ?? null,
    },
    { status: 200 }
  );
}
