"use server";

import { getQuoteByDayNumber } from "@/lib/quotes";

/**
 * Returns the quote for the given calendar day (day of year 1–365).
 * Quotes are in-code (lib/quotes-data.json); no Supabase.
 */
export async function getQuoteForDay(dayOfYear: number) {
  return getQuoteByDayNumber(Math.max(1, Math.min(365, dayOfYear)));
}
