import { describe, expect, it } from "vitest";
import {
  assignProtocolTaskDueDates,
  assignProtocolTaskDueDatesFromWeek,
  dateStrToProtocolDow,
  datesFromTodayThroughWeekEnd,
} from "@/lib/growth/spread-protocol-due-dates";

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

describe("assignProtocolTaskDueDatesFromWeek", () => {
  it("maps tasks to preferred weekdays still in the pool", () => {
    const mon = "2026-04-06";
    const pool = datesFromTodayThroughWeekEnd(mon);
    const tasks = [
      { id: "a", title: "", concrete: "", minutes: 10, preferred_days: [1, 2] },
      { id: "b", title: "", concrete: "", minutes: 10, preferred_days: [5, 6] },
    ];
    const due = assignProtocolTaskDueDatesFromWeek(tasks, undefined, mon);
    expect(due).toHaveLength(2);
    for (const d of due) {
      expect(pool).toContain(d);
    }
    const dows = due.map((d) => dateStrToProtocolDow(d));
    expect(dows.some((d) => d === 1 || d === 2)).toBe(true);
    expect(dows.some((d) => d === 5 || d === 6)).toBe(true);
  });

  it("uses day_overview task_ids over preferred_days", () => {
    const mon = "2026-04-06";
    const pool = datesFromTodayThroughWeekEnd(mon);
    const tasks = [
      { id: "only-thu", title: "", concrete: "", minutes: 5, preferred_days: [1] },
    ];
    const week = {
      week_index: 1,
      phase_id: "p",
      title: "",
      objective: "",
      tasks,
      day_overview: [{ day_of_week: 4, focus_line: "", task_ids: ["only-thu"] }],
    };
    const due = assignProtocolTaskDueDatesFromWeek(tasks, week, mon);
    expect(due).toHaveLength(1);
    expect(dateStrToProtocolDow(due[0]!)).toBe(4);
    expect(pool).toContain(due[0]!);
  });
});
