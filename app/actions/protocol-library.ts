"use server";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

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
