/**
 * Static image URLs to decode during daily bootstrap so HUD / nav / theme visuals
 * are warm after the first load (not the per-page hero mascots under /mascots/).
 */

import {
  EMOTION_2D_PATHS,
  EMOTION_2D_PATHS_GIRLY,
  EMOTION_2D_PATHS_INDUSTRIAL,
  GIRLY_THEME_BACKGROUND_PATH,
  INDUSTRIAL_THEME_BACKGROUND_PATH,
} from "@/lib/emotions";

/** Layer images referenced from globals / HUD (see app/globals.css, hud.module.css). */
const GLOBAL_HUD_VISUAL_URLS: readonly string[] = [
  "/Background12.PNG",
  "/grain.PNG",
  "/stars.png",
];

/**
 * Bottom tab PNGs — keep aligned with `lib/navigation/bottom-nav-links.tsx` (+ BottomNavIcon URL rules).
 */
const BOTTOM_NAV_ICON_URLS: readonly string[] = [
  `/nav/${encodeURIComponent("Missions.png")}`,
  `/nav/${encodeURIComponent("Budget.png")}`,
  `/nav/${encodeURIComponent("Growth.png")}`,
  `/nav/${encodeURIComponent("Dashboard.png")}`,
  `/nav/${encodeURIComponent("Strategy.png")}`,
  "/Icons/User.PNG",
  `/nav/${encodeURIComponent("Settings.png")}`,
];

function uniqueEmotionAndThemeUrls(): string[] {
  const set = new Set<string>();
  for (const p of Object.values(EMOTION_2D_PATHS)) set.add(p);
  for (const p of Object.values(EMOTION_2D_PATHS_GIRLY)) set.add(p);
  for (const p of Object.values(EMOTION_2D_PATHS_INDUSTRIAL)) set.add(p);
  set.add(GIRLY_THEME_BACKGROUND_PATH);
  set.add(INDUSTRIAL_THEME_BACKGROUND_PATH);
  return [...set];
}

/** Deduped list of shell / theme / emotion raster URLs for bootstrap preload. */
export function getBootstrapShellVisualPreloadUrls(): string[] {
  const out = new Set<string>();
  for (const u of BOTTOM_NAV_ICON_URLS) out.add(u);
  for (const u of GLOBAL_HUD_VISUAL_URLS) out.add(u);
  for (const u of uniqueEmotionAndThemeUrls()) out.add(u);
  out.add("/logo-naam.png");
  out.add("/app-icon.png");
  return [...out];
}
