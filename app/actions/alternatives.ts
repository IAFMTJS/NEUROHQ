"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Alternative = {
  id: string;
  type: string;
  reference_id: string | null;
  suggestion_text: string;
  created_at: string;
};

export async function getAlternatives(): Promise<Alternative[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("alternatives")
    .select("id, type, reference_id, suggestion_text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as Alternative[];
}

export async function createAlternative(params: {
  type: string;
  reference_id?: string | null;
  suggestion_text: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await (supabase as any).from("alternatives").insert({
    user_id: user.id,
    type: params.type,
    reference_id: params.reference_id ?? null,
    suggestion_text: params.suggestion_text,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}

export async function dismissAlternative(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("alternatives").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
}
