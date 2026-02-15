"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Returns the quote for a given calendar day. dayOfYear 1 = Jan 1, 365 = Dec 31; 365 quotes, one per date. */
export async function getQuoteForDay(dayOfYear: number) {
  const id = Math.max(1, Math.min(365, dayOfYear));
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      const { data } = await supabase.from("quotes").select("*").eq("id", id).single();
      return data;
    },
    ["quote", String(id)],
    { tags: [`quote-${id}`], revalidate: 86400 }
  )();
}
