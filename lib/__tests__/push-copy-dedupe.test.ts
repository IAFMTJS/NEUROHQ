import { describe, it, expect } from "vitest";
import { PushCopyDedupe, parsePushCopyHistory } from "@/lib/push-copy-dedupe";

describe("PushCopyDedupe", () => {
  it("avoids repeating same index in window when pool small", () => {
    const h = parsePushCopyHistory({
      "quote:auto:title": [{ day: "2025-01-01", index: 0 }],
    });
    const d = new PushCopyDedupe("2025-01-02", h, 7);
    const idx = d.pickIndex(2, "quote:auto:title", "seed");
    expect(idx).toBe(1);
    expect(d.dirty).toBe(true);
  });

  it("parses invalid history as empty", () => {
    expect(parsePushCopyHistory(null)).toEqual({});
    expect(parsePushCopyHistory([])).toEqual({});
  });
});
