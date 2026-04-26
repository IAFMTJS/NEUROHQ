import { describe, expect, it } from "vitest";
import { buildPersonalGrowthMissionPreview } from "@/lib/user-goal-mission-preview";

describe("buildPersonalGrowthMissionPreview", () => {
  it("uses intensity to influence count", () => {
    const base = {
      area: "Discipline",
      goal: "Meer consistent sporten doordeweeks",
      tags: ["health"],
      horizonDays: 14,
    } as const;

    expect(buildPersonalGrowthMissionPreview({ ...base, intensity: "light" })).toHaveLength(8);
    expect(buildPersonalGrowthMissionPreview({ ...base, intensity: "normal" })).toHaveLength(14);
    expect(buildPersonalGrowthMissionPreview({ ...base, intensity: "intense" })).toHaveLength(20);
  });

  it("spreads due dates within the horizon window", () => {
    const rows = buildPersonalGrowthMissionPreview({
      area: "Social",
      goal: "Meer initiatief nemen in gesprekken",
      tags: [],
      intensity: "normal",
      horizonDays: 7,
    });
    const dates = rows.map((r) => r.due_date).sort();
    const min = dates[0]!;
    const max = dates[dates.length - 1]!;
    const minD = new Date(min + "T12:00:00Z");
    const maxD = new Date(max + "T12:00:00Z");
    const diffDays = Math.round((maxD.getTime() - minD.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeLessThanOrEqual(6);
  });

  it("includes area and goal metadata in notes", () => {
    const [row] = buildPersonalGrowthMissionPreview({
      area: "Confidence",
      goal: "Meer assertief zijn op werk",
      tags: ["career", "discipline"],
      intensity: "light",
      horizonDays: 14,
    });
    expect(row?.notes ?? "").toContain("Doel:");
    expect(row?.notes ?? "").toContain("Area:");
    expect(row?.notes ?? "").toContain("Intensity:");
    expect(row?.notes ?? "").toContain("Horizon:");
    expect(row?.notes ?? "").toContain("Tags:");
  });
});

