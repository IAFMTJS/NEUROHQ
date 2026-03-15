import type { PushPayload } from "@/lib/push";

// ---- Tone + personality model ------------------------------------------------

export type Tone =
  | "neutral"
  | "friendly"
  | "stoic"
  | "coach"
  | "sarcastic"
  | "aggressive"
  | "overstimulating";

export type PersonalityMode =
  | "auto"
  | "stoic"
  | "friendly"
  | "coach"
  | "drill"
  | "chaos";

export type TriggerType =
  | "brain_status_reminder"
  | "brain_status_recheck"
  | "app_open_no_action"
  | "multi_opens_no_action"
  | "page_switch_burst"
  | "mission_completed"
  | "multi_missions"
  | "high_productivity"
  | "streak_protection"
  | "streak_growth"
  | "rank_progress"
  | "rank_achieved"
  | "inactivity_24h"
  | "inactivity_3d"
  | "inactivity_7d"
  | "inactivity_14d"
  | "positive_surprise"
  | "behavioral_coaching_high_brain_idle"
  | "behavioral_coaching_low_brain_active"
  | "too_many_open_missions"
  | "escalation_no_missions_today";

// High-level behavior events the rest of the app / crons can emit.
// These are intentionally compact and behaviour-focused; they are not DB models.
export type BehaviorEvent =
  | { type: "brain_status_missing" }
  | { type: "brain_status_stale" }
  | { type: "app_open_no_action"; opens: number; minutesSinceFirstOpen: number }
  | { type: "page_switch_burst"; switches: number; durationMinutes: number }
  | { type: "mission_completed"; missionsInWindow: number; windowMinutes: number }
  | { type: "productivity_session"; actionsInWindow: number; windowMinutes: number }
  | { type: "streak_risk"; currentStreak: number }
  | { type: "streak_growth"; newStreak: number }
  | { type: "rank_progress"; xpToNextRank: number }
  | { type: "rank_achieved"; newRankName: string }
  | { type: "high_brain_no_action"; energy: number; focus: number }
  | { type: "low_brain_active"; energy: number; focus: number }
  | { type: "too_many_open_missions"; openMissions: number }
  | { type: "inactivity_window"; daysInactive: number }
  | { type: "positive_surprise"; consistencyScore: number }
  | { type: "escalation_no_missions_today"; ignoredCount: number };

export type MessageTemplate = {
  title?: string;
  body: string;
  tag?: string;
  url?: string;
};

export type AppModeForPush = "normal" | "low_energy" | "high_sensory" | "driven" | "stabilize";

export type UserNotificationContext = {
  /** 0–100: how consistent this user is (7–30d behaviour index). */
  consistencyScore: number;
  /** Selected personality mode; "auto" lets the engine adapt. */
  personalityMode: PersonalityMode;
  /** Optional: derived from daily_state + carry_over for tone/light copy. */
  mode?: AppModeForPush;
  energy?: number | null;
  focus?: number | null;
  sensory_load?: number | null;
  taskCountToday?: number;
  calendarEventCountToday?: number;
  /** Current streak for contextual copy. */
  currentStreak?: number;
  /** Missions completed this week (for evening / weekly copy). */
  missionsCompletedThisWeek?: number;
};

// ---- Small helpers -----------------------------------------------------------

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((acc, w) => acc + w, 0);
  if (!items.length || total <= 0) return items[0];
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ---- Tone selection ----------------------------------------------------------

export function pickTone(baseCandidates: Tone[], ctx: UserNotificationContext): Tone {
  // Personality override modes
  switch (ctx.personalityMode) {
    case "stoic":
      return "stoic";
    case "friendly":
      return "friendly";
    case "coach":
      return "coach";
    case "drill":
      return "aggressive";
    case "chaos":
      // Chaos = sarcasm plus overstimulation roulette.
      return Math.random() < 0.5 ? "sarcastic" : "overstimulating";
    case "auto":
    default:
      break;
  }

  // Richer context: low_energy → friendlier; high_sensory → calmer/shorter (neutral/stoic).
  if (ctx.mode === "low_energy") {
    return weightedRandom(["friendly", "neutral", "coach"], [0.5, 0.3, 0.2]);
  }
  if (ctx.mode === "high_sensory") {
    return weightedRandom(["neutral", "stoic"], [0.6, 0.4]);
  }

  // Auto mode: adapt based on consistency.
  if (ctx.consistencyScore >= 80) {
    return weightedRandom(["friendly", "coach", "stoic"], [0.4, 0.4, 0.2]);
  }
  if (ctx.consistencyScore <= 30) {
    // More direct, slightly sharper.
    return weightedRandom(["coach", "sarcastic", "neutral"], [0.5, 0.3, 0.2]);
  }

  return randomFrom(baseCandidates.length ? baseCandidates : ["neutral"]);
}

// ---- Message pool (spec-backed) ---------------------------------------------

type MessagePool = Record<TriggerType, Partial<Record<Tone, MessageTemplate[]>>>;

// Personality-aligned copy: Stoic = short, wisdom; Friendly = warm, supportive; Coach = direct, action; Drill = aggressive; Chaos = sarcastic/overstimulating.
export const MESSAGE_POOL: MessagePool = {
  brain_status_reminder: {
    neutral: [{ body: "Your brain status hasn’t been logged." }],
    friendly: [{ body: "Quick check-in — how’s your brain today? Set it when you’re ready." }],
    stoic: [{ body: "Awareness precedes control. Log brain status." }],
    coach: [{ body: "Set your brain status so we can tailor today’s missions." }],
    aggressive: [{ body: "Brain status missing. Log it. Now." }],
    sarcastic: [
      { body: "Hard to optimize a brain we haven’t measured." },
      { body: "We’d love to help. If only we knew what state your brain is in. 🙃" },
      { body: "Brain status: unknown. The system is literally blind. Your move." },
    ],
    overstimulating: [
      { body: "BRAIN STATUS MISSING ⚠️\nSYSTEM BLIND. LOG IT. NOW." },
      { body: "⚠️ NO BRAIN DATA ⚠️\nWE CAN'T HELP IF WE DON'T KNOW. LOG IT. 🔥" },
      { body: "ALERT: BRAIN STATUS = ???\nFIX IT. 🔴" },
    ],
  },
  brain_status_recheck: {
    neutral: [{ body: "Your brain status hasn’t changed today. Still accurate?" }],
    friendly: [{ body: "Energy shifts throughout the day — update if it’s changed." }],
    stoic: [{ body: "State may have shifted. Recheck if needed." }],
    coach: [{ body: "Still accurate? Update brain status if your energy or focus changed." }],
    sarcastic: [{ body: "Either you’re perfectly stable or you forgot to update it." }],
  },
  app_open_no_action: {
    neutral: [{ body: "You opened the app but haven’t started anything." }],
    friendly: [{ body: "You’re here — pick one small thing and start when you’re ready." }],
    stoic: [{ body: "Open. Now act." }],
    coach: [{ body: "Pick a mission. One. Then start." }],
    aggressive: [{ body: "App open. No action. Pick a mission." }],
    sarcastic: [{ body: "Scrolling the app isn’t productivity." }],
    overstimulating: [{ body: "APP OPEN ⚡ NO ACTION ⚡ SELECT MISSION." }],
  },
  multi_opens_no_action: {
    neutral: [{ body: "You’ve opened the app three times but completed nothing." }],
    friendly: [{ body: "Third time’s the charm — choose one mission and open it." }],
    stoic: [{ body: "Three opens. Zero completions. Choose one." }],
    coach: [{ body: "Execution missing. Open one mission and do the first step." }],
    aggressive: [{ body: "Three opens. No execution. Pick one. Do it." }],
    sarcastic: [{ body: "Tour of the app completed. Ready to do something now?" }],
  },
  page_switch_burst: {
    neutral: [{ body: "Exploration complete." }],
    friendly: [{ body: "You’ve seen the pages — now pick one task and stick with it." }],
    stoic: [{ body: "Enough navigation. One task." }],
    coach: [{ body: "You’ve now seen every page. Pick one task and focus." }],
    sarcastic: [{ body: "You’ve now seen every page. Pick one task." }],
    overstimulating: [{ body: "NAVIGATION LOOP DETECTED ⚠️ PICK ONE TASK." }],
  },
  mission_completed: {
    neutral: [{ body: "Mission completed." }],
    friendly: [{ body: "Nice work. Keep going when you’re ready." }],
    stoic: [{ body: "Progress recorded." }],
    coach: [{ body: "Momentum is building. Next?" }],
    aggressive: [{ body: "Done. Next mission." }],
    overstimulating: [{ body: "MISSION COMPLETE ⚡ PROGRESS UPDATED." }],
  },
  multi_missions: {
    neutral: [{ body: "Momentum detected." }, { body: "Three missions down." }],
    friendly: [{ body: "Three missions done — you’re on a roll." }],
    stoic: [{ body: "Three completed. Consistency." }],
    coach: [{ body: "Three down. Keep the rhythm." }],
    sarcastic: [{ body: "Look at that. Actual productivity." }],
    overstimulating: [{ body: "COMBO ACTIVATED ⚡⚡⚡" }],
  },
  high_productivity: {
    neutral: [{ body: "Strong session." }, { body: "Focus mode detected." }],
    friendly: [{ body: "Strong session — you’re in the zone." }],
    stoic: [{ body: "Focus. Noted." }],
    coach: [{ body: "Strong session. Lock this in." }],
    sarcastic: [{ body: "Who are you and what did you do with procrastination?" }],
  },
  streak_protection: {
    neutral: [{ body: "Your streak is at risk." }, { body: "One mission saves it." }],
    friendly: [{ body: "Your streak could use one mission today — you’ve got this." }],
    stoic: [{ body: "One mission. Streak preserved." }],
    coach: [{ body: "Streak at risk. One mission saves it. Pick one." }],
    aggressive: [{ body: "Streak at risk. One mission. Do it." }],
    sarcastic: [{ body: "Your streak is currently hanging by a thread." }],
  },
  streak_growth: {
    neutral: [{ body: "Streak extended." }, { body: "Consistency compounds." }],
    friendly: [{ body: "Streak extended — consistency pays off." }],
    stoic: [{ body: "Streak extended. Discipline." }],
    coach: [{ body: "Streak up. Keep the habit." }],
    overstimulating: [{ body: "STREAK LEVEL UP ⚡" }],
  },
  rank_progress: {
    neutral: [{ body: "You’re close to leveling up." }],
    friendly: [{ body: "You’re close to a level up — one more push." }],
    stoic: [{ body: "Near level. One mission." }],
    coach: [{ body: "Close to level up. One mission away." }],
    sarcastic: [{ body: "One mission away from glory." }],
  },
  rank_achieved: {
    neutral: [{ body: "New rank unlocked." }, { body: "Level up." }],
    friendly: [{ body: "Level up — well done." }],
    stoic: [{ body: "Rank upgraded." }],
    coach: [{ body: "New rank. Keep going." }],
    overstimulating: [{ body: "RANK UPGRADE ⚡⚡⚡" }],
  },
  inactivity_24h: {
    neutral: [{ body: "No activity logged today." }, { body: "The system needs input." }],
    friendly: [{ body: "No activity today yet — when you’re ready, one small mission counts." }],
    stoic: [{ body: "No input today. One action." }],
    coach: [{ body: "No activity logged. Log brain status or complete one mission." }],
    aggressive: [{ body: "No activity. Log something. One mission." }],
    sarcastic: [{ body: "Today: zero. Care to change that?" }],
  },
  inactivity_3d: {
    neutral: [{ body: "Your system hasn’t seen you recently." }],
    friendly: [{ body: "We haven’t seen you in a few days — one tiny step when you’re ready." }],
    stoic: [{ body: "Three days. Return with one action." }],
    coach: [{ body: "Three days inactive. Restart with one mission or brain status." }],
    sarcastic: [{ body: "Remember this app?" }],
  },
  inactivity_7d: {
    neutral: [{ body: "Restart small." }],
    friendly: [{ body: "A week — no pressure. Restart with one small mission when you’re ready." }],
    stoic: [{ body: "Seven days. Restart. One step." }],
    coach: [{ body: "Week without activity. Restart small: one mission or brain status." }],
    aggressive: [{ body: "Seven days. Restart. One mission." }],
    sarcastic: [{ body: "It’s been a week. One mission would be a start." }],
  },
  inactivity_14d: {
    neutral: [{ body: "The system waits." }],
    friendly: [{ body: "Two weeks — we’re here when you’re ready. One small step." }],
    stoic: [{ body: "Fourteen days. Return. One action." }],
    coach: [{ body: "Two weeks inactive. Restart with one mission or a quick brain status." }],
    sarcastic: [
      { body: "Two weeks. The system is still here. Surprisingly." },
      { body: "Fourteen days. We didn't forget you. (Did you forget us?) 😏" },
    ],
    overstimulating: [{ body: "TWO WEEKS. THE SYSTEM AWAITS. ONE MISSION. RETURN. ⚡" }],
  },
  positive_surprise: {
    neutral: [
      { body: "The system noticed consistency." },
      { body: "Your effort is visible." },
      { body: "Tiny progress still counts." },
      { body: "Momentum beats perfection." },
    ],
    friendly: [{ body: "Your consistency is showing — keep it up." }],
    stoic: [{ body: "Consistency noted." }],
    coach: [{ body: "Momentum building. Keep the standard." }],
    sarcastic: [
      { body: "You're suspiciously productive today." },
      { body: "Who are you and what have you done with the usual you? We approve." },
    ],
  },
  behavioral_coaching_high_brain_idle: {
    neutral: [
      { body: "High energy detected but no missions started." },
      { body: "This is prime execution time." },
    ],
    friendly: [{ body: "You’ve got the energy — pick one mission and start." }],
    stoic: [{ body: "Energy high. Action zero. Choose one." }],
    coach: [{ body: "High energy, no missions. Prime time — pick one and start." }],
    sarcastic: [
      { body: "All that energy and still nothing?" },
      { body: "Brain says you're ready. Missions completed: zero. Make it make sense. 🙃" },
    ],
    overstimulating: [{ body: "⚠️ HIGH ENERGY. ZERO MISSIONS. WASTE DETECTED. PICK ONE. 🔥" }],
  },
  behavioral_coaching_low_brain_active: {
    neutral: [
      { body: "Energy seems low. Try smaller missions." },
      { body: "Slow progress still counts." },
    ],
    friendly: [{ body: "Energy’s low — small missions still count. Be kind to yourself." }],
    stoic: [{ body: "Low energy. Small steps." }],
    coach: [{ body: "Energy low. Pick a small mission or recovery task." }],
  },
  too_many_open_missions: {
    neutral: [{ body: "You’re collecting missions." }],
    friendly: [{ body: "Lots of open missions — pick one to focus on." }],
    stoic: [{ body: "Too many open. Complete one." }],
    coach: [{ body: "Too many open. Close or complete one before adding more." }],
    sarcastic: [
      { body: "Congratulations on your mission hoarding." },
      { body: "You've got a lot of open missions. Completion rate: not great. Pick one. 🙃" },
    ],
    overstimulating: [{ body: "⚠️ TOO MANY OPEN. CLOSE ONE. COMPLETE ONE. FOCUS. 🔴" }],
  },
  escalation_no_missions_today: {
    neutral: [{ body: "Execution missing." }],
    coach: [{ body: "No missions completed today. Pick one. Do it." }],
    aggressive: [{ body: "Zero completed. One mission. Now." }],
    sarcastic: [{ body: "Today's mission count: zero. We're just putting that out there. 😬" }],
    overstimulating: [{ body: "⚠️ ZERO MISSIONS TODAY. ONE. DO IT. NOW. 🔥" }],
  },
};

export function pickMessage(trigger: TriggerType, tone: Tone): MessageTemplate | null {
  const poolForTrigger = MESSAGE_POOL[trigger];
  if (!poolForTrigger) return null;
  const candidates = poolForTrigger[tone] ?? poolForTrigger.neutral;
  if (!candidates || candidates.length === 0) return null;
  return randomFrom(candidates);
}

// Simple priority heuristic; wiring to sendPushToUser.priority comes later.
export function decidePriority(trigger: TriggerType): PushPayload["priority"] {
  if (
    trigger === "streak_protection" ||
    trigger === "streak_growth" ||
    trigger === "rank_achieved" ||
    trigger === "inactivity_7d" ||
    trigger === "inactivity_14d" ||
    trigger === "behavioral_coaching_high_brain_idle"
  ) {
    return "high";
  }
  if (trigger === "mission_completed" || trigger === "positive_surprise") {
    return "low";
  }
  return "normal";
}

export function getBaseTonesForTrigger(trigger: TriggerType): Tone[] {
  const pool = MESSAGE_POOL[trigger];
  if (!pool) return ["neutral"];
  return Object.keys(pool) as Tone[];
}

// Escalation chain specifically for "no missions today" style messaging.
const ESCALATION_CHAIN: MessageTemplate[][] = [
  [{ body: "No missions completed today." }],
  [{ body: "Still no progress logged." }],
  [{ body: "One mission would fix this." }],
  [{ body: "Execution missing." }],
];

export function pickEscalatedMessage(ignoredCount: number): MessageTemplate {
  const idx = Math.min(Math.max(ignoredCount, 0), ESCALATION_CHAIN.length - 1);
  const level = ESCALATION_CHAIN[idx];
  return randomFrom(level);
}

// ---- Pure engine entrypoint --------------------------------------------------

export type EngineResult = {
  trigger: TriggerType;
  tone: Tone;
  payload: PushPayload;
};

/**
 * Pure notification engine: maps a high-level BehaviorEvent + user context
 * to a PushPayload, without touching DB, cron, or delivery.
 *
 * Integration code is responsible for:
 * - enforcing per-trigger cooldowns,
 * - checking daily push limits (sendPushToUser),
 * - cancelling outdated notifications after user action.
 */
export function buildBehavioralNotificationForContext(
  ctx: UserNotificationContext,
  event: BehaviorEvent
): EngineResult | null {
  let trigger: TriggerType | null = null;

  switch (event.type) {
    case "brain_status_missing":
      trigger = "brain_status_reminder";
      break;
    case "brain_status_stale":
      trigger = "brain_status_recheck";
      break;
    case "app_open_no_action":
      trigger = event.opens >= 3 ? "multi_opens_no_action" : "app_open_no_action";
      break;
    case "page_switch_burst":
      if (event.switches >= 5 && event.durationMinutes <= 2) {
        trigger = "page_switch_burst";
      }
      break;
    case "mission_completed":
      trigger =
        event.missionsInWindow >= 3 && event.windowMinutes <= 45
          ? "multi_missions"
          : "mission_completed";
      break;
    case "productivity_session":
      if (event.actionsInWindow >= 5 && event.windowMinutes <= 30) {
        trigger = "high_productivity";
      }
      break;
    case "streak_risk":
      if (event.currentStreak > 0) {
        trigger = "streak_protection";
      }
      break;
    case "streak_growth":
      trigger = "streak_growth";
      break;
    case "rank_progress":
      if (event.xpToNextRank > 0 && event.xpToNextRank <= 150) {
        trigger = "rank_progress";
      }
      break;
    case "rank_achieved":
      trigger = "rank_achieved";
      break;
    case "high_brain_no_action":
      if (event.energy >= 7 && event.focus >= 6) {
        trigger = "behavioral_coaching_high_brain_idle";
      }
      break;
    case "low_brain_active":
      if (event.energy <= 4) {
        trigger = "behavioral_coaching_low_brain_active";
      }
      break;
    case "too_many_open_missions":
      if (event.openMissions >= 5) {
        trigger = "too_many_open_missions";
      }
      break;
    case "inactivity_window":
      if (event.daysInactive >= 14) trigger = "inactivity_14d";
      else if (event.daysInactive >= 7) trigger = "inactivity_7d";
      else if (event.daysInactive >= 3) trigger = "inactivity_3d";
      else if (event.daysInactive >= 1) trigger = "inactivity_24h";
      break;
    case "positive_surprise":
      if (event.consistencyScore >= 70) {
        trigger = "positive_surprise";
      }
      break;
    case "escalation_no_missions_today":
      trigger = "escalation_no_missions_today";
      break;
  }

  if (!trigger) return null;

  const baseTones = getBaseTonesForTrigger(trigger);
  const tone = pickTone(baseTones, ctx);

  const template =
    trigger === "escalation_no_missions_today"
      ? pickEscalatedMessage(
          (event as Extract<BehaviorEvent, { type: "escalation_no_missions_today" }>).ignoredCount
        )
      : pickMessage(trigger, tone);

  if (!template) return null;

  const payload: PushPayload = {
    title: template.title ?? "NEUROHQ",
    body: template.body,
    tag: template.tag ?? trigger,
    url: template.url ?? "/dashboard",
    priority: decidePriority(trigger),
  };

  return { trigger, tone, payload };
}

