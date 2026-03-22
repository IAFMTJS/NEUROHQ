import { pickVariantIndex } from "@/lib/push-copy-variant";

/** Pool key → recent picks { day, index } */
export type PushCopyHistory = Record<string, Array<{ day: string; index: number }>>;

const MAX_ENTRIES_PER_KEY = 24;

export function parsePushCopyHistory(raw: unknown): PushCopyHistory {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as PushCopyHistory;
}

function dayDiff(a: string, b: string): number {
  const t0 = new Date(`${a}T12:00:00Z`).getTime();
  const t1 = new Date(`${b}T12:00:00Z`).getTime();
  return Math.round((t1 - t0) / (24 * 60 * 60 * 1000));
}

function blockedIndices(
  history: PushCopyHistory,
  poolKey: string,
  currentDay: string,
  windowDays: number
): Set<number> {
  const blocked = new Set<number>();
  const entries = history[poolKey];
  if (!entries?.length) return blocked;
  for (const e of entries) {
    if (dayDiff(e.day, currentDay) <= windowDays && dayDiff(e.day, currentDay) >= -windowDays) {
      blocked.add(e.index);
    }
  }
  return blocked;
}

function recordPick(history: PushCopyHistory, poolKey: string, day: string, index: number): PushCopyHistory {
  const next: PushCopyHistory = { ...history, [poolKey]: [...(history[poolKey] ?? [])] };
  next[poolKey]!.push({ day, index });
  if (next[poolKey]!.length > MAX_ENTRIES_PER_KEY) {
    next[poolKey] = next[poolKey]!.slice(-MAX_ENTRIES_PER_KEY);
  }
  return next;
}

/**
 * Stateful helper for applyPersonalityToPayload: avoids repeating the same pool index within windowDays.
 */
export class PushCopyDedupe {
  private history: PushCopyHistory;
  public dirty = false;

  constructor(
    private readonly dayKey: string,
    history: PushCopyHistory,
    private readonly windowDays: number
  ) {
    this.history = JSON.parse(JSON.stringify(history)) as PushCopyHistory;
  }

  pickIndex(poolLen: number, poolKey: string, seedBase: string): number {
    if (poolLen <= 0) return 0;
    const blocked = blockedIndices(this.history, poolKey, this.dayKey, this.windowDays);
    let idx = pickVariantIndex(seedBase, poolLen);
    let tries = 0;
    while (blocked.has(idx) && tries < poolLen * 4) {
      tries++;
      idx = pickVariantIndex(`${seedBase}:retry:${tries}`, poolLen);
    }
    this.history = recordPick(this.history, poolKey, this.dayKey, idx);
    this.dirty = true;
    return idx;
  }

  getHistory(): PushCopyHistory {
    return this.history;
  }
}
