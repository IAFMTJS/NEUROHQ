import { describe, expect, it } from "vitest";
import { assignProtocolTaskDueDates, datesFromTodayThroughWeekEnd } from "@/lib/growth/spread-protocol-due-dates";

describe("assignProtocolTaskDueDates", () => {
  it("returns one date per task within week window from Wednesday", () => {
    const wed = "2026-04-08"; // Wednesday
    const pool = datesFromTodayThroughWeekEnd(wed);
    expect(pool.length).toBeGreaterThanOrEqual(1);
    expect(pool[0]).toBe(wed);
    const due = assignProtocolTaskDueDates(5, wed);
    expect(due).toHaveLength(5);
    for (const d of due) {
      expect(pool).toContain(d);
    }
  });
});
