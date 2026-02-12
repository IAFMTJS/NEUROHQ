import { describe, it, expect } from "vitest";
import { yesterdayDate, getDayOfYearFromDateString } from "./timezone";

describe("yesterdayDate", () => {
  it("returns previous day for YYYY-MM-DD", () => {
    expect(yesterdayDate("2025-02-12")).toBe("2025-02-11");
    expect(yesterdayDate("2025-01-01")).toBe("2024-12-31");
  });
});

describe("getDayOfYearFromDateString", () => {
  it("returns 1 for Jan 1", () => {
    expect(getDayOfYearFromDateString("2025-01-01")).toBe(1);
  });
  it("returns 32 for Feb 1 (non-leap)", () => {
    expect(getDayOfYearFromDateString("2025-02-01")).toBe(32);
  });
  it("returns 365 for Dec 31 (non-leap)", () => {
    expect(getDayOfYearFromDateString("2025-12-31")).toBe(365);
  });
});
