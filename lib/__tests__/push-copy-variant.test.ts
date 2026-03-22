import { describe, it, expect } from "vitest";
import { pickVariantIndex } from "@/lib/push-copy-variant";

describe("pickVariantIndex", () => {
  it("is stable for same seed", () => {
    expect(pickVariantIndex("u1:2025-03-22:quote", 10)).toBe(pickVariantIndex("u1:2025-03-22:quote", 10));
  });

  it("differs when seed differs", () => {
    const a = pickVariantIndex("u1:2025-03-22", 50);
    const b = pickVariantIndex("u2:2025-03-22", 50);
    expect(a).not.toBe(b);
  });
});
