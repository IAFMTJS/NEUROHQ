import { describe, expect, it } from "vitest";
import {
  deriveDcicSuggestedMode,
  getBehavioralConstraints,
  getBrainState,
  getEffectiveBehavioralStats,
  normalizeBehavioralStats,
  normalizeSystemLoadToTenScale,
  resolveMentalLoad1To10,
} from "@/lib/behavioral-engine";

describe("behavioral-engine load normalization", () => {
  it("maps 0-100 load to 1-10 scale", () => {
    expect(normalizeSystemLoadToTenScale(80)).toBe(8);
    expect(normalizeSystemLoadToTenScale(10)).toBe(10);
    expect(normalizeSystemLoadToTenScale(0)).toBe(1);
  });

  it("prefers system load over sensory fallback", () => {
    const resolved = resolveMentalLoad1To10({
      systemLoad: 70,
      sensoryLoad: 2,
      fallback: 5,
    });
    expect(resolved).toBe(7);
  });
});

describe("behavioral-engine mode suggestion", () => {
  it("suggests recovery when load is high", () => {
    const normalized = normalizeBehavioralStats({
      energy: 8,
      focus: 8,
      mentalBattery: 8,
      mentalLoad: 8,
      physicalHealth: 7,
      sleepHours: 7.5,
    });
    const effective = getEffectiveBehavioralStats(normalized);
    const constraints = getBehavioralConstraints(normalized);
    const brainState = getBrainState(effective);

    const suggestion = deriveDcicSuggestedMode({
      normalized,
      effective,
      brainState,
      constraints,
    });

    expect(suggestion).toBe("recovery");
  });

  it("suggests war when capacity is high and load is low/medium", () => {
    const normalized = normalizeBehavioralStats({
      energy: 9,
      focus: 9,
      mentalBattery: 9,
      mentalLoad: 3,
      physicalHealth: 8,
      sleepHours: 8,
    });
    const effective = getEffectiveBehavioralStats(normalized);
    const constraints = getBehavioralConstraints(normalized);
    const brainState = getBrainState(effective);

    const suggestion = deriveDcicSuggestedMode({
      normalized,
      effective,
      brainState,
      constraints,
    });

    expect(suggestion).toBe("war");
  });
});
