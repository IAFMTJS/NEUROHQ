import { describe, expect, it } from "vitest";
import { maybeAutoTriggerOverdrive, pickWeeklySlotWeekdays } from "@/lib/dcic/overdrive-auto";
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
      weeklyRandomSlotToday: false,
      weeklySlotTriggersThisIsoWeek: 0,
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
      weeklyRandomSlotToday: false,
      weeklySlotTriggersThisIsoWeek: 0,
    });
    expect(d).toEqual({ shouldTrigger: true, reason: "momentum_combo" });
  });

  it("triggers on streak rescue (late day, first completion)", () => {
    const s = baseState();
    const d = maybeAutoTriggerOverdrive(s, {
      nowMs: Date.now(),
      localHour: 17,
      alreadyTriggeredToday: false,
      modeLocked: false,
      completionsInLast45m: 1,
      completionsToday: 1,
      streakAtRisk: true,
      weeklyRandomSlotToday: false,
      weeklySlotTriggersThisIsoWeek: 0,
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
      weeklyRandomSlotToday: false,
      weeklySlotTriggersThisIsoWeek: 0,
    });
    expect(d.shouldTrigger).toBe(false);
  });

  it("triggers weekly_slot when random slot day and under weekly cap", () => {
    const s = baseState();
    const d = maybeAutoTriggerOverdrive(s, {
      nowMs: Date.now(),
      localHour: 10,
      alreadyTriggeredToday: false,
      modeLocked: false,
      completionsInLast45m: 0,
      completionsToday: 0,
      streakAtRisk: false,
      weeklyRandomSlotToday: true,
      weeklySlotTriggersThisIsoWeek: 0,
    });
    expect(d).toEqual({ shouldTrigger: true, reason: "weekly_slot" });
  });

  it("does not weekly_slot when weekly cap reached", () => {
    const s = baseState();
    const d = maybeAutoTriggerOverdrive(s, {
      nowMs: Date.now(),
      localHour: 10,
      alreadyTriggeredToday: false,
      modeLocked: false,
      completionsInLast45m: 0,
      completionsToday: 0,
      streakAtRisk: false,
      weeklyRandomSlotToday: true,
      weeklySlotTriggersThisIsoWeek: 2,
    });
    expect(d.shouldTrigger).toBe(false);
  });

  it("does not auto-trigger outside 08:00–18:00 (weekly_slot at 07:00)", () => {
    const s = baseState();
    const d = maybeAutoTriggerOverdrive(s, {
      nowMs: Date.now(),
      localHour: 7,
      alreadyTriggeredToday: false,
      modeLocked: false,
      completionsInLast45m: 0,
      completionsToday: 0,
      streakAtRisk: false,
      weeklyRandomSlotToday: true,
      weeklySlotTriggersThisIsoWeek: 0,
    });
    expect(d.shouldTrigger).toBe(false);
  });

  it("does not auto-trigger outside 08:00–18:00 (momentum at 19:00)", () => {
    const s = baseState();
    const d = maybeAutoTriggerOverdrive(s, {
      nowMs: Date.now(),
      localHour: 19,
      alreadyTriggeredToday: false,
      modeLocked: false,
      completionsInLast45m: 3,
      completionsToday: 3,
      streakAtRisk: false,
      weeklyRandomSlotToday: false,
      weeklySlotTriggersThisIsoWeek: 0,
    });
    expect(d.shouldTrigger).toBe(false);
  });

  it("pickWeeklySlotWeekdays is stable for the same user and week", () => {
    const a = pickWeeklySlotWeekdays("user-1", "2026-04-06");
    const b = pickWeeklySlotWeekdays("user-1", "2026-04-06");
    expect(a.size).toBe(2);
    expect(b.size).toBe(2);
    expect([...a].sort()).toEqual([...b].sort());
  });

  it("pickWeeklySlotWeekdays can differ across weeks for same user", () => {
    const weeks = [
      "2026-01-05",
      "2026-01-12",
      "2026-01-19",
      "2026-01-26",
      "2026-02-02",
      "2026-02-09",
    ].map((m) => pickWeeklySlotWeekdays("user-1", m));
    const signatures = weeks.map((s) => [...s].sort().join(","));
    const unique = new Set(signatures);
    expect(unique.size).toBeGreaterThan(1);
  });
});

