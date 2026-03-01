/**
 * Maps energy, focus, and load percentages (0–100) to the appropriate penguin GLB model.
 * Uses energy as primary, load as override for stress states, focus for nuance.
 */
export type PenguinMood =
  | "drained"
  | "sleepy"
  | "questioning"
  | "motivated"
  | "excited"
  | "angry"
  | "neon";

export function getPenguinModel(
  energyPct: number,
  focusPct: number,
  loadPct: number
): PenguinMood {
  // High load (stress) → Angry penguin
  if (loadPct >= 75) return "angry";

  // Energy-driven mapping
  if (energyPct < 25) return "drained";
  if (energyPct < 45) return "sleepy";
  if (energyPct < 60) return "questioning";
  if (energyPct < 80) return "motivated";
  if (energyPct >= 95) return "neon";
  return "excited";
}

export const MODEL_PATHS: Record<PenguinMood, string> = {
  drained: "/models/penguin-drained.glb",
  sleepy: "/models/penguin-sleepy.glb",
  questioning: "/models/penguin-questioning.glb",
  motivated: "/models/penguin-motivated.glb",
  excited: "/models/penguin-excited.glb",
  angry: "/models/penguin-angry.glb",
  neon: "/models/penguin-neon.glb",
};
