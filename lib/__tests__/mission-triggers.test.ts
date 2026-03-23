import { describe, expect, it } from "vitest";
import { evaluateTemplateAgainstTriggers, resolveMissionTriggers } from "@/lib/mission-triggers";
import type { MasterMissionTemplate } from "@/lib/mission-templates";

function template(partial: Partial<MasterMissionTemplate>): MasterMissionTemplate {
  return {
    id: "test-template",
    title: "Test template",
    domain: "discipline",
    subcategory: "focus_attention",
    category: "work",
    energy: 6,
    baseXP: 50,
    xpLevel: "normal",
    description: "test",
    tags: [],
    ...partial,
  };
}

describe("mission-triggers", () => {
  it("adds no-heavy guard when heavy work is disallowed", () => {
    const triggers = resolveMissionTriggers({
      energy1To10: 4,
      focus1To10: 4,
      sensoryLoad1To10: 4,
      allowHeavyNow: false,
      dayType: "work",
    });
    const ids = triggers.map((t) => t.id);
    expect(ids).toContain("guard_no_heavy_now");
  });

  it("hard-blocks high-energy template on low energy recovery guard", () => {
    const triggers = resolveMissionTriggers({
      energy1To10: 3,
      focus1To10: 4,
      sensoryLoad1To10: 5,
      allowHeavyNow: true,
      dayType: "work",
    });

    const evalResult = evaluateTemplateAgainstTriggers(
      template({
        energy: 7,
        subcategory: "energy_recovery",
        tags: ["recovery"],
      }),
      triggers
    );

    expect(evalResult.blocked).toBe(true);
    expect(evalResult.reasons.some((reason) => reason.includes("low_energy_recovery_bias"))).toBe(true);
  });
});
