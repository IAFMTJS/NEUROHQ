import { describe, expect, it } from "vitest";
import { bandFor10Scale, getMissionCountRangeForEnergyBand } from "@/lib/behavioral-engine";
import { computeAutoMissionTarget, deriveAutoMissionIntent, pickAutoMissionsSmart } from "@/lib/master-mission-pool";

function mockProfile(overrides?: Partial<import("@/types/behavior-profile.types").BehaviorProfile>) {
  return {
    weekTheme: "self_discipline",
    neuroProfileTags: [],
    disciplineLevel: 0.5,
    confrontationMode: "gentle",
    energyPattern: "unknown",
    identityTargets: ["disciplined"],
    hobbyCommitment: { fitness: 0.2, music: 0.2, language: 0.2, creative: 0.2 },
    ...overrides,
  } as unknown as import("@/types/behavior-profile.types").BehaviorProfile;
}

function mockAvoidance(overrides?: Partial<import("@/app/actions/avoidance-tracker").AvoidanceTracker>) {
  return {
    household: { skipped: 0, completed: 0 },
    administration: { skipped: 0, completed: 0 },
    social: { skipped: 0, completed: 0 },
    ...overrides,
  } as unknown as import("@/app/actions/avoidance-tracker").AvoidanceTracker;
}

describe("auto-missions smart distribution", () => {
  it("clamps target within energy band min/max and adapts down when day is full", () => {
    const energy = 6;
    const band = bandFor10Scale(energy);
    const { min, max } = getMissionCountRangeForEnergyBand(band);

    const targetEmpty = computeAutoMissionTarget(
      {
        profile: mockProfile(),
        weekTheme: "self_discipline",
        avoidanceTracker: mockAvoidance(),
        allowHeavyNow: true,
        dateStr: "2026-03-31",
        energy1To10: energy,
        focus1To10: 6,
        sensoryLoad1To10: 4,
        dayType: "work",
        existingNonAutoCount: 0,
        existingNonAutoEquivalents: 0,
      },
      { min, max }
    );
    expect(targetEmpty).toBeGreaterThanOrEqual(min);
    expect(targetEmpty).toBeLessThanOrEqual(max);

    const targetFull = computeAutoMissionTarget(
      {
        profile: mockProfile(),
        weekTheme: "self_discipline",
        avoidanceTracker: mockAvoidance(),
        allowHeavyNow: true,
        dateStr: "2026-03-31",
        energy1To10: energy,
        focus1To10: 6,
        sensoryLoad1To10: 4,
        dayType: "work",
        existingNonAutoCount: 10,
        existingNonAutoEquivalents: 12,
      },
      { min, max }
    );
    expect(targetFull).toBe(min);
  });

  it("recovery day picks only structure/energy slots", () => {
    const picks = pickAutoMissionsSmart(
      {
        profile: mockProfile(),
        weekTheme: "health_body",
        avoidanceTracker: mockAvoidance({ household: { skipped: 5, completed: 0 } }),
        allowHeavyNow: false,
        dateStr: "2026-03-31",
        energy1To10: 3,
        focus1To10: 3,
        sensoryLoad1To10: 8,
        dayType: "off_hard",
      },
      3
    );
    expect(picks.length).toBeGreaterThan(0);
    for (const p of picks) {
      const sc = p.subcategory ?? "";
      expect(sc.startsWith("structure_") || sc.startsWith("energy_")).toBe(true);
    }
  });

  it("high avoidance ensures a procrastination attack appears when requested", () => {
    const picks = pickAutoMissionsSmart(
      {
        profile: mockProfile(),
        weekTheme: "self_discipline",
        avoidanceTracker: mockAvoidance({ administration: { skipped: 3, completed: 0 } }),
        allowHeavyNow: true,
        dateStr: "2026-03-31",
        energy1To10: 6,
        focus1To10: 6,
        sensoryLoad1To10: 4,
        dayType: "work",
      },
      4
    );
    expect(picks.some((p) => p.slot === "procrastination_attack")).toBe(true);
  });

  it("derives mission intent from slot/tags/subcategory + context", () => {
    const picks = pickAutoMissionsSmart(
      {
        profile: mockProfile({ identityTargets: ["disciplined"] }),
        weekTheme: "self_discipline",
        avoidanceTracker: mockAvoidance({ administration: { skipped: 3, completed: 0 } }),
        allowHeavyNow: true,
        dateStr: "2026-03-31",
        energy1To10: 6,
        focus1To10: 6,
        sensoryLoad1To10: 4,
        dayType: "work",
        brainMode: "Driven",
      },
      4
    );

    const intents = picks.map((p) =>
      deriveAutoMissionIntent({
        template: p,
        slot: p.slot,
        dayType: "work",
        brainMode: "Driven",
        energy1To10: 6,
        focus1To10: 6,
        sensoryLoad1To10: 4,
      })
    );

    expect(intents.length).toBeGreaterThan(0);
    // Procrastination attacks should map to experiment.
    for (let i = 0; i < picks.length; i++) {
      if (picks[i]?.slot === "procrastination_attack") {
        expect(intents[i]).toBe("experiment");
      }
    }

    // Identity/hobby/courage should map to alignment if present.
    for (let i = 0; i < picks.length; i++) {
      const sc = picks[i]?.subcategory ?? "";
      if (sc === "identity" || sc === "courage" || sc.startsWith("hobby_")) {
        expect(intents[i]).toBe("alignment");
      }
    }
  });
});

