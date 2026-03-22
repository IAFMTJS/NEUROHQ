import type { DifficultyTier } from "@/lib/growth/adaptive-engine";

export function tierLabelNl(t: DifficultyTier): string {
  if (t === "easy") return "Light";
  if (t === "hard") return "Heavy";
  return "Standard";
}
