/**
 * Commander v2 is de enige visuele stijl. Theme/colorMode zijn vastgezet.
 * CSS variables via data-theme + data-color-mode in globals.css.
 */

export type ThemeId = "normal";
export type ColorMode = "dark";

export const THEME_IDS: ThemeId[] = ["normal"];
export const COLOR_MODES: ColorMode[] = ["dark"];

export const THEME_LABELS: Record<ThemeId, string> = {
  normal: "Commander v2",
};

export const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  dark: "Dark",
};

/** Effective theme key: [data-theme="normal"][data-color-mode="dark"] */
export function getThemeDataAttrs(_theme?: ThemeId, _colorMode?: ColorMode) {
  return { "data-theme": "normal" as const, "data-color-mode": "dark" as const };
}
