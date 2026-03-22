import { describe, it, expect } from "vitest";
import { formatQuoteForPushBody } from "@/lib/quotes";
import type { QuoteRow } from "@/lib/quotes";

describe("formatQuoteForPushBody", () => {
  it("includes author when space allows", () => {
    const row: QuoteRow = { quote_text: "Short.", author_name: "Author Name" };
    const s = formatQuoteForPushBody(row, 120);
    expect(s).toContain("Short.");
    expect(s).toContain("Author Name");
    expect(s).toContain("—");
  });

  it("truncates long quote but keeps author suffix", () => {
    const row: QuoteRow = {
      quote_text: "A".repeat(200),
      author_name: "X",
    };
    const s = formatQuoteForPushBody(row, 120);
    expect(s.length).toBeLessThanOrEqual(120);
    expect(s).toContain("—");
  });
});
