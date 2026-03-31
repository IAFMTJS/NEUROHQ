import { describe, expect, it } from "vitest";
import { maybeAutoTriggerOverdrive } from "@/lib/dcic/overdrive-auto";
import type { GameState } from "@/lib/dcic/types";

function baseState(): GameState {
  return {
    level: 1,
    currentXP: 0,
    xpToNextLevel: 1000,
    stats: { energy: 80, focus: 80, load: 30 },
    missions: [],
    skills: {},
    streak: { current: 1, longest: 1, lastCompletionDate: "2026-03-30" },
    rank: "R0",
    achievements: {},
    difficultyEngine: {
      dailyMissions: 3,
      missionDurationMin: 10,
      missionDurationMax: 30,
      cognitiveTier: 1,
      discomfortTier: 1,
      autopilotLevel: 1,
    },
    mode: {
      current: "focus",
      lockedUntil: null,
      lastSwitch: null,
      overdriveSessionStart: null,
      warStage: 1,
      suggested: null,
      nextWarBonus: null,
      brainStatusAveragePercent: 80,
      warTierDaysLast7: 0,
      overdriveAutoTriggered: false,
      overdriveTriggerReason: null,
      overdriveTriggeredAt: null,
    },
    authority: {
      overrideChance: 0.15,
      lastOverrideDate: null,
      lastSuggestedMode: null,
      patterns: {
        missionSpamCount: 0,
        easyTaskAbuseCount: 0,
        modeSwitchAbuseCount: 0,
        lastAbuseDate: null,
        warSessionsThisWeek: 0,
        recoverySessionsThisWeek: 0,
        idleDaysThisWeek: 0,
      },
    },
    activeEvents: [],
    identity: { discipline: 0, resilience: 0, consistency: 0, constraints: {} },
  };
}

describe("maybeAutoTriggerOverdrive", () => {
  it("does not trigger when already triggered today", () => {
    const s = baseState();
    const d = maybeAutoTriggerOverdrive(s, {
      nowMs: Date.now(),
      localHour: 12,
      alreadyTriggeredToday: true,
      modeLocked: false,
      completionsInLast45m: 10,
      completionsToday: 10,
      streakAtRisk: true,
    });
    expect(d.shouldTrigger).toBe(false);
  });

  it("triggers on momentum combo (3+ completions in 45m)", () => {
    const s = baseState();
    const d = maybeAutoTriggerOverdrive(s, {
      nowMs: Date.now(),
      localHour: 12,
      alreadyTriggeredToday: false,
      modeLocked: false,
      completionsInLast45m: 3,
      completionsToday: 3,
      streakAtRisk: false,
    });
    expect(d).toEqual({ shouldTrigger: true, reason: "momentum_combo" });
  });

  it("triggers on streak rescue (late day, first completion)", () => {
    const s = baseState();
    const d = maybeAutoTriggerOverdrive(s, {
      nowMs: Date.now(),
      localHour: 19,
      alreadyTriggeredToday: false,
      modeLocked: false,
      completionsInLast45m: 1,
      completionsToday: 1,
      streakAtRisk: true,
    });
    expect(d).toEqual({ shouldTrigger: true, reason: "streak_rescue" });
  });

  it("does not trigger when capacity is low", () => {
    const s = baseState();
    s.stats.energy = 40;
    const d = maybeAutoTriggerOverdrive(s, {
      nowMs: Date.now(),
      localHour: 12,
      alreadyTriggeredToday: false,
      modeLocked: false,
      completionsInLast45m: 5,
      completionsToday: 5,
      streakAtRisk: false,
    });
    expect(d.shouldTrigger).toBe(false);
  });
});

