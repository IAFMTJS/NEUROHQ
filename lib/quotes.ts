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

/** Max characters for quote text in the notification body (author goes in the title). */
export const PUSH_QUOTE_BODY_MAX_CHARS = 220;

/**
 * Quote + author for personality push formatting: author is always visible in the title when present;
 * body is the quote (truncated). `combinedBody` stays compatible with legacy single-field formatting.
 */
export function prepareQuoteForPersonalityPush(
  row: QuoteRow | null,
  maxQuoteChars = PUSH_QUOTE_BODY_MAX_CHARS
): {
  quoteText: string;
  author: string | null;
  combinedBody: string;
} {
  const author = row?.author_name?.trim() || null;
  const raw = (row?.quote_text ?? "Your daily focus.").trim();
  const quoteText =
    raw.length > maxQuoteChars ? `${raw.slice(0, Math.max(0, maxQuoteChars - 1))}…` : raw;
  return {
    quoteText,
    author,
    combinedBody: formatQuoteForPushBody(row, 160),
  };
}

/**
 * Parse legacy "quote — author" combined lines (em dash, en dash, or ASCII hyphen).
 */
export function parseQuoteBodyCombined(combined: string): { quote: string; author: string | null } {
  const s = combined.trim();
  const splitAt = (idx: number, sepLen: number): { quote: string; author: string | null } | null => {
    if (idx < 8) return null;
    const author = s.slice(idx + sepLen).trim();
    return { quote: s.slice(0, idx).trim(), author: author || null };
  };
  const em = s.lastIndexOf(" — ");
  if (em >= 8) {
    const r = splitAt(em, 3);
    if (r) return r;
  }
  const en = s.lastIndexOf(" – ");
  if (en >= 8) {
    const r = splitAt(en, 3);
    if (r) return r;
  }
  const hy = s.lastIndexOf(" - ");
  if (hy >= 8) {
    const r = splitAt(hy, 3);
    if (r) return r;
  }
  return { quote: s, author: null };
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
