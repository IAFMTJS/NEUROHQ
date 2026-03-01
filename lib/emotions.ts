/**
 * Unified emotion model for 2D emotion PNGs and UI accent.
 * Aligns with PenguinMood in model-mapping.ts where overlapping.
 */

import type { ThemeId } from "@/lib/theme-tokens";

export type EmotionKey =
  | "drained"
  | "sleepy"
  | "questioning"
  | "motivated"
  | "excited"
  | "angry"
  | "neon"
  | "hyped"
  | "evil";

/** 2D emotion PNG paths under public (URLs from root) */
export const EMOTION_2D_PATHS: Record<EmotionKey, string> = {
  drained: "/2D Emotions PNGs/Mentally drained.png",
  sleepy: "/2D Emotions PNGs/Sleepy.png",
  questioning: "/2D Emotions PNGs/Questioning.png",
  motivated: "/2D Emotions PNGs/Motivated.png",
  excited: "/2D Emotions PNGs/Excited.png",
  angry: "/2D Emotions PNGs/Angry.png",
  neon: "/2D Emotions PNGs/Excited.png", // reuse or add HYPED when distinct
  hyped: "/2D Emotions PNGs/HYPED.png",
  evil: "/2D Emotions PNGs/EVIL.png",
};

/** Girly theme emotion PNGs (public/Girly Theme/) – mapped from EmotionKey */
export const EMOTION_2D_PATHS_GIRLY: Record<EmotionKey, string> = {
  drained: "/Girly Theme/Exhausted.png",
  sleepy: "/Girly Theme/Normal.png",
  questioning: "/Girly Theme/Normal.png",
  motivated: "/Girly Theme/Motivated.png",
  excited: "/Girly Theme/Happy.png",
  angry: "/Girly Theme/Angry.png",
  neon: "/Girly Theme/Happy.png",
  hyped: "/Girly Theme/Determined.png",
  evil: "/Girly Theme/Evil.png",
};

/** Public path for Girly theme background image */
export const GIRLY_THEME_BACKGROUND_PATH = "/Girly Theme/Background.png";

/** Industrial theme emotion PNGs (public/Industrial Theme/) – mapped from EmotionKey */
export const EMOTION_2D_PATHS_INDUSTRIAL: Record<EmotionKey, string> = {
  drained: "/Industrial Theme/Tired.png",
  sleepy: "/Industrial Theme/Tired.png",
  questioning: "/Industrial Theme/Determined.png",
  motivated: "/Industrial Theme/Determined.png",
  excited: "/Industrial Theme/Determined.png",
  angry: "/Industrial Theme/Evil.png",
  neon: "/Industrial Theme/Determined.png",
  hyped: "/Industrial Theme/Determined.png",
  evil: "/Industrial Theme/Evil.png",
};

/** Public path for Industrial theme background image */
export const INDUSTRIAL_THEME_BACKGROUND_PATH = "/Industrial Theme/Background.png";

/** Returns the 2D emotion image path. Commander v2 only – always normal set. */
export function getEmotionImagePath(emotion: EmotionKey, _theme?: ThemeId): string {
  return EMOTION_2D_PATHS[emotion];
}

/** Optional emotion accent hue (HSL) for card borders / glows per theme */
export const EMOTION_ACCENT_HSL: Partial<Record<EmotionKey, string>> = {
  drained: "220 20% 45%",
  sleepy: "240 15% 50%",
  questioning: "260 30% 55%",
  motivated: "160 60% 45%",
  excited: "30 90% 55%",
  angry: "0 70% 50%",
  neon: "180 100% 50%",
  hyped: "320 80% 55%",
  evil: "280 60% 40%",
};

export const EMOTION_LABELS: Record<EmotionKey, string> = {
  drained: "Mentally drained",
  sleepy: "Sleepy",
  questioning: "Questioning",
  motivated: "Motivated",
  excited: "Excited",
  angry: "Angry",
  neon: "Neon",
  hyped: "Hyped",
  evil: "Evil",
};

export const EMOTION_KEYS: EmotionKey[] = [
  "drained",
  "sleepy",
  "questioning",
  "motivated",
  "excited",
  "angry",
  "hyped",
  "neon",
  "evil",
];
