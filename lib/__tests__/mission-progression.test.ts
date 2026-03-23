import { describe, expect, it } from "vitest";
import {
  deriveProgressionKeyFromTemplate,
  parseMissionProgressionFromTaskTags,
  resolveMissionProgressionPlan,
} from "@/lib/mission-progression";
import type { MasterMissionTemplate } from "@/lib/mission-templates";

function template(partial: Partial<MasterMissionTemplate>): MasterMissionTemplate {
  return {
    id: "deep-work-30",
    title: "Deep Work 30 min",
    domain: "discipline",
    subcategory: "focus_attention",
    category: "work",
    energy: 4,
    baseXP: 50,
    xpLevel: "normal",
    description: "test",
    tags: [],
    ...partial,
  };
}

describe("mission-progression", () => {
  it("derives progression key from template fields", () => {
    const key = deriveProgressionKeyFromTemplate(
      template({
        id: "walk-20",
        title: "20 Min Walk",
        subcategory: "energy_movement",
      })
    );
    expect(key).toBe("energy_walk");
  });

  it("resolves next tier based on stored state", () => {
    const plan = resolveMissionProgressionPlan(
      template({
        id: "deep-work-30",
        title: "Deep Work 30 min",
        subcategory: "focus_attention",
      }),
      {
        deep_focus: {
          currentTier: 2,
          completions: 6,
        },
      }
    );

    expect(plan).not.toBeNull();
    expect(plan?.key).toBe("deep_focus");
    expect(plan?.tier).toBe(3);
    expect(plan?.nextTier).toBe(4);
  });

  it("parses progression metadata from task tags", () => {
    const parsed = parseMissionProgressionFromTaskTags([
      "progression_key:deep_focus",
      "progression_tier:2",
      "progression_next:3",
      "progression_max:4",
    ]);

    expect(parsed).toEqual({
      key: "deep_focus",
      tier: 2,
      nextTier: 3,
      maxTier: 4,
    });
  });
});
