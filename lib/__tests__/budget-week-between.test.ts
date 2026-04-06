import { describe, expect, it } from "vitest";
import { wholeBudgetWeeksBetween } from "@/lib/utils/budget-date";

describe("wholeBudgetWeeksBetween", () => {
  it("returns 0 when same Monday", () => {
    expect(wholeBudgetWeeksBetween("2026-04-06", "2026-04-06")).toBe(0);
  });

  it("returns 1 for consecutive weeks", () => {
    expect(wholeBudgetWeeksBetween("2026-03-30", "2026-04-06")).toBe(1);
  });

  it("returns 3 after three skipped weeks", () => {
    expect(wholeBudgetWeeksBetween("2026-03-16", "2026-04-06")).toBe(3);
  });

  it("returns 0 when current is before anchor", () => {
    expect(wholeBudgetWeeksBetween("2026-04-13", "2026-04-06")).toBe(0);
  });
});
