import type { GameState } from "./types";

type EventType = "boost" | "penalty" | "disruption";

type EventConfig = {
  type: EventType;
  durationMinutes: number;
};

const EVENT_DEFINITIONS: Record<string, EventConfig> = {
  focus_surge: { type: "boost", durationMinutes: 30 },
  mental_fog: { type: "penalty", durationMinutes: 30 },
  opportunity_double_reward: { type: "disruption", durationMinutes: 30 },
};

export function triggerRandomEvents(gameState: GameState, today: string): void {
  const roll = Math.random();
  if (roll > 0.15) return;

  const codes = Object.keys(EVENT_DEFINITIONS);
  if (!codes.length) return;

  const code = codes[Math.floor(Math.random() * codes.length)];
  const def = EVENT_DEFINITIONS[code];
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + def.durationMinutes * 60 * 1000
  ).toISOString();

  gameState.activeEvents = gameState.activeEvents.filter(
    (e) => e.code !== code
  );

  gameState.activeEvents.push({
    type: def.type,
    code,
    expiresAt,
  });
}

export function applyActiveEvents(gameState: GameState, now: number = Date.now()): {
  xpMultiplier: number;
  focusDelta: number;
} {
  let xpMultiplier = 1;
  let focusDelta = 0;

  const active: typeof gameState.activeEvents = [];
  for (const event of gameState.activeEvents) {
    const expiresMs = Date.parse(event.expiresAt);
    if (!Number.isNaN(expiresMs) && expiresMs > now) {
      active.push(event);
      if (event.type === "boost" && event.code === "focus_surge") {
        xpMultiplier *= 1.3;
      }
      if (event.type === "penalty" && event.code === "mental_fog") {
        focusDelta -= 20;
      }
    }
  }
  gameState.activeEvents = active;

  return { xpMultiplier, focusDelta };
}

