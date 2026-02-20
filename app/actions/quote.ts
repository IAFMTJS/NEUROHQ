"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Quote id for a day: spread so consecutive days get different quotes (avoids same quote back-to-back).
 * Uses (dayOfYear * 31 + 7) % 365 so day 1 and day 2 get different ids; 365 distinct ids over the year.
 * If the result would equal previous day's id, add 1 (mod 365) so no two consecutive days share a quote.
 */
function quoteIdForDay(dayOfYear: number, previousDayQuoteId?: number): number {
  const d = Math.max(1, Math.min(365, dayOfYear));
  let id = ((d - 1) * 31 + 7) % 365 + 1;
  if (previousDayQuoteId != null && id === previousDayQuoteId) {
    id = (id % 365) + 1;
    if (id > 365) id = 1;
  }
  return id;
}

/** Returns the quote for a given calendar day. dayOfYear 1 = Jan 1, 365 = Dec 31. */
export async function getQuoteForDay(dayOfYear: number) {
  const prevId = dayOfYear > 1 ? quoteIdForDay(dayOfYear - 1) : undefined;
  const id = quoteIdForDay(dayOfYear, prevId);
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
