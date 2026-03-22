/** Deterministic index for A/B-style notification copy (same user + day + context = stable pick). */
export function pickVariantIndex(seed: string, modulo: number): number {
  if (modulo <= 0) return 0;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0) % modulo;
}
