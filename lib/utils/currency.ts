/** Currency symbols for common codes. Fallback to code if unknown. */
const SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  JPY: "¥",
};

export function getCurrencySymbol(code: string | null | undefined): string {
  if (!code) return "€";
  return SYMBOLS[code] ?? code;
}

/** Format cents as currency string (e.g. 12345 -> "123.45") */
export function formatCents(cents: number, currencyCode?: string | null): string {
  const symbol = getCurrencySymbol(currencyCode ?? "EUR");
  const value = (Math.abs(cents) / 100).toFixed(2);
  const sign = cents < 0 ? "−" : "";
  return `${sign}${symbol}${value}`;
}

/** Format for display in inputs/tables: just the number with 2 decimals */
export function formatCentsValue(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Parse user input (e.g. "123.45" or "1234") to cents */
export function parseToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  if (isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}
