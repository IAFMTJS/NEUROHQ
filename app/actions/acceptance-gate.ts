"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

/** Active gate blocks normal navigation until resolved (UI uses this later). */
export async function getActiveAcceptanceGate(): Promise<{
  id: string;
  gate_type: string;
  payload: Record<string, unknown>;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_acceptance_gates")
    .select("id, gate_type, payload")
    .eq("user_id", user.id)
    .is("resolved_at", null)
    .order("triggered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id as string,
    gate_type: data.gate_type as string,
    payload: (data.payload as Record<string, unknown>) ?? {},
  };
}

export async function resolveAcceptanceGate(gateId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase
    .from("user_acceptance_gates")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", gateId)
    .eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/budget");
}

/**
 * Server-side: open a gate when rules fire (cron / actions). Not exposed to client without auth checks.
 * Used by internal compliance or future rule engine.
 */
export async function createAcceptanceGateForUser(params: {
  gateType: string;
  payload?: Record<string, unknown>;
}): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("user_acceptance_gates")
    .insert({
      user_id: user.id,
      gate_type: params.gateType,
      payload: (params.payload ?? {}) as Json,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  revalidatePath("/dashboard");
  return { id: data.id as string };
}
