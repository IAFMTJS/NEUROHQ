import { DOMAINS, type StrategyDomain, type WeeklyAllocation } from "@/lib/strategyDomains";

/** Legacy: scale all domains to sum 100 (e.g. initial load from server). */
export function normalizeTo100(alloc: WeeklyAllocation): WeeklyAllocation {
  const sum = Object.values(alloc).reduce((a, b) => a + b, 0);
  if (sum === 0) {
    const eq = 25;
    return { discipline: eq, health: eq, learning: eq, business: eq };
  }
  if (sum === 100) return { ...alloc };
  const scale = 100 / sum;
  const out: WeeklyAllocation = { ...alloc };
  for (const d of DOMAINS) {
    out[d] = Math.round((alloc[d] ?? 0) * scale);
  }
  let newSum = DOMAINS.reduce((s, d) => s + (out[d] ?? 0), 0);
  if (newSum !== 100) {
    out[DOMAINS[0]] = (out[DOMAINS[0]] ?? 0) + (100 - newSum);
  }
  return out;
}

/**
 * Move one slider: that domain gets the chosen value; the other three split the remainder
 * proportionally to their previous values (so the adjusted slider does not rescale itself via others).
 */
export function applySliderChange(
  prev: WeeklyAllocation,
  changed: StrategyDomain,
  rawValue: number
): WeeklyAllocation {
  const v = Math.max(0, Math.min(100, Math.round(rawValue)));
  const others = DOMAINS.filter((d) => d !== changed);
  const remainder = 100 - v;
  const next: WeeklyAllocation = { ...prev, [changed]: v };

  if (remainder <= 0) {
    for (const d of others) next[d] = 0;
    return next;
  }

  const prevOthersSum = others.reduce((s, d) => s + (prev[d] ?? 0), 0);
  if (prevOthersSum <= 0) {
    const n = others.length;
    const base = Math.floor(remainder / n);
    let left = remainder;
    for (let i = 0; i < n; i++) {
      const add = i === n - 1 ? left : base;
      next[others[i]] = add;
      left -= add;
    }
    return next;
  }

  let assigned = 0;
  for (let i = 0; i < others.length; i++) {
    const d = others[i];
    const raw = ((prev[d] ?? 0) / prevOthersSum) * remainder;
    const rounded = i === others.length - 1 ? remainder - assigned : Math.round(raw);
    next[d] = Math.max(0, rounded);
    assigned += next[d] ?? 0;
  }

  const total = DOMAINS.reduce((s, d) => s + (next[d] ?? 0), 0);
  if (total !== 100) {
    const diff = 100 - total;
    const fixTarget = others[others.length - 1];
    next[fixTarget] = Math.max(0, (next[fixTarget] ?? 0) + diff);
  }
  return next;
}
