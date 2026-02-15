/**
 * Theme and color mode identifiers for the NEUROHQ theme system.
 * CSS variables are applied via data-theme and data-color-mode in globals.css.
 */

export type ThemeId = "normal" | "girly" | "industrial";
export type ColorMode = "dark" | "light";

export const THEME_IDS: ThemeId[] = ["normal", "girly", "industrial"];
export const COLOR_MODES: ColorMode[] = ["dark", "light"];

export const THEME_LABELS: Record<ThemeId, string> = {
  normal: "Normal",
  girly: "Girly",
  industrial: "Industrial",
};

export const COLOR_MODE_LABELS: Record<ColorMode, string> = {
  dark: "Dark",
  light: "Light",
};

/** Effective theme key for CSS selectors: [data-theme="normal"][data-color-mode="dark"] */
export function getThemeDataAttrs(theme: ThemeId, colorMode: ColorMode) {
  return { "data-theme": theme, "data-color-mode": colorMode };
}
