import { describe, it, expect } from "vitest";
import {
  formatQuoteForPushBody,
  prepareQuoteForPersonalityPush,
  parseQuoteBodyCombined,
} from "@/lib/quotes";
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

describe("prepareQuoteForPersonalityPush", () => {
  it("splits author and quote text", () => {
    const row: QuoteRow = { quote_text: "Hello world.", author_name: "Ada" };
    const p = prepareQuoteForPersonalityPush(row);
    expect(p.author).toBe("Ada");
    expect(p.quoteText).toContain("Hello");
    expect(p.combinedBody).toContain("Ada");
  });
});

describe("parseQuoteBodyCombined", () => {
  it("parses em-dash author suffix", () => {
    const { quote, author } = parseQuoteBodyCombined("Short line — Marcus");
    expect(quote).toBe("Short line");
    expect(author).toBe("Marcus");
  });
});
