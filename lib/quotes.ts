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

/** Push/notification body: quote text plus author, total length capped (default 120). */
export function formatQuoteForPushBody(row: QuoteRow | null, maxLen = 120): string {
  const text = row?.quote_text ?? "Your daily focus.";
  const authorRaw = row?.author_name?.trim();
  if (!authorRaw) {
    return text.length > maxLen ? `${text.slice(0, Math.max(0, maxLen - 1))}…` : text;
  }
  let author = authorRaw;
  let suffix = ` — ${author}`;
  if (text.length + suffix.length <= maxLen) return `${text}${suffix}`;
  const maxAuthor = Math.min(author.length, Math.max(8, maxLen - 20));
  if (author.length > maxAuthor) {
    author = `${author.slice(0, maxAuthor - 1)}…`;
    suffix = ` — ${author}`;
  }
  const budget = maxLen - suffix.length - 1;
  if (budget < 12) {
    return `${text.slice(0, Math.max(0, maxLen - suffix.length - 1))}…${suffix}`;
  }
  return `${text.slice(0, budget)}…${suffix}`;
}
