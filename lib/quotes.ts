/**
 * Quotes by day number (1–365). Loaded from code, no Supabase.
 * Day 1 = Jan 1, 365 = Dec 31. The app uses date → day-of-year and picks the quote by id.
 */

import quotesData from "./quotes-data.json";

export type QuoteRow = {
  quote_text: string;
  author_name: string;
};

const QUOTES_BY_ID = quotesData as Record<string, QuoteRow>;

/**
 * Quote id for a day: spread so consecutive days get different quotes.
 * Uses (dayOfYear * 31 + 7) % 365 so day 1 and day 2 get different ids.
 * If the result would equal previous day's id, add 1 (mod 365).
 */
export function quoteIdForDay(dayOfYear: number, previousDayQuoteId?: number): number {
  const d = Math.max(1, Math.min(365, dayOfYear));
  let id = ((d - 1) * 31 + 7) % 365 + 1;
  if (previousDayQuoteId != null && id === previousDayQuoteId) {
    id = (id % 365) + 1;
    if (id > 365) id = 1;
  }
  return id;
}

/**
 * Returns the quote for the given calendar day (day of year 1–365).
 * Sync; no database. Used by getQuoteForDay (server action) and cron.
 */
export function getQuoteByDayNumber(dayOfYear: number): QuoteRow | null {
  const prevId = dayOfYear > 1 ? quoteIdForDay(dayOfYear - 1) : undefined;
  const id = quoteIdForDay(dayOfYear, prevId);
  const row = QUOTES_BY_ID[String(id)];
  return row ?? null;
}
