"use server";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";
import { revalidatePath } from "next/cache";

export type ProtocolLibraryRow = Tables<"protocol_library">;

/** Published protocol trajectories (content library). Empty if table has no rows or RLS blocks. */
export async function getProtocolLibrary(locale = "nl"): Promise<ProtocolLibraryRow[]> {
  const supabase = await createClient();
  const { data: nlRows, error: nlErr } = await supabase
    .from("protocol_library")
    .select("*")
    .eq("locale", locale)
    .order("sort_order", { ascending: true });

  if (!nlErr && nlRows?.length) return nlRows as ProtocolLibraryRow[];

  const { data: anyRows } = await supabase.from("protocol_library").select("*").order("sort_order", { ascending: true });

  return (anyRows ?? []) as ProtocolLibraryRow[];
}

type UpdateProtocolInput = {
  id: string;
  title: string;
  summary?: string | null;
  body_md: string;
};

/** Update protocol content in-app (title/summary/body markdown). */
export async function updateProtocolLibraryContent(input: UpdateProtocolInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = input.title.trim();
  const body = input.body_md.trim();
  if (title.length < 3) throw new Error("Titel is te kort.");
  if (body.length < 10) throw new Error("Protocol inhoud is te kort.");

  const { error } = await supabase
    .from("protocol_library")
    .update({
      title,
      summary: input.summary?.trim() ? input.summary.trim() : null,
      body_md: body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
