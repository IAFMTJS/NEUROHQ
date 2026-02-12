"use server";

import { createClient } from "@/lib/supabase/server";

export async function getQuoteForDay(dayOfYear: number) {
  const supabase = await createClient();
  const id = Math.max(1, Math.min(365, dayOfYear));
  const { data } = await supabase.from("quotes").select("*").eq("id", id).single();
  return data;
}
