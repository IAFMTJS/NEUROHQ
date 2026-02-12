import { describe, it, expect } from "vitest";
import { weeklyRequired } from "./savings";

describe("weeklyRequired", () => {
  it("returns null when deadline is null", () => {
    expect(weeklyRequired(10000, 0, null)).toBeNull();
  });

  it("returns 0 when deadline has passed", () => {
    const past = "2020-01-01";
    expect(weeklyRequired(10000, 0, past)).toBe(0);
  });

  it("returns remaining divided by weeks when deadline in future", () => {
    const future = new Date();
    future.setDate(future.getDate() + 14);
    const deadline = future.toISOString().slice(0, 10);
    const result = weeklyRequired(10000, 0, deadline);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(10000);
  });

  it("returns 0 when current >= target", () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    expect(weeklyRequired(10000, 10000, future.toISOString().slice(0, 10))).toBe(0);
  });
});
