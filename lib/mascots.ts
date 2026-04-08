/**
 * Dashboard Commander hero mascots live in `public/mascots/`.
 * Bump MASCOT_CACHE_VERSION when replacing images so clients bypass browser cache.
 */
const MASCOTS_BASE = "/mascots";
const MASCOT_CACHE_VERSION = 5;

/** DCIC operational mode; extra modes use dedicated artwork + shell `data-mode` glow tokens. */
export type DashboardMascotMode = "focus" | "war" | "recovery" | "overdrive";

export const DEFAULT_MASCOT_FILE = "Homepage Mascotte.png";
export const LOADING_MASCOT_FILE = "Loading screen option 2.PNG";
export const LOGIN_SCREEN_MASCOT_FILE = "Loginscreen.PNG";

const MODE_MASCOT_FILE: Partial<Record<DashboardMascotMode, string>> = {
  war: "War Mode Mascotte.png",
  recovery: "Recovery Mode Mascotte.png",
  overdrive: "Overdrive Mode Mascotte.png",
};

/** Distinct mascot image URLs for native prefetch / Filesystem warm-cache. */
export function listDashboardMascotWarmUrls(): string[] {
  const files = [
    DEFAULT_MASCOT_FILE,
    LOADING_MASCOT_FILE,
    LOGIN_SCREEN_MASCOT_FILE,
    ...Object.values(MODE_MASCOT_FILE).filter((f): f is string => typeof f === "string" && f.length > 0),
  ];
  const unique = [...new Set(files)];
  return unique.map(
    (file) => `${MASCOTS_BASE}/${encodeURIComponent(file)}?v=${MASCOT_CACHE_VERSION}`
  );
}

export function getDashboardMascotSrc(mode?: DashboardMascotMode | null): string {
  const file = (mode && MODE_MASCOT_FILE[mode]) || DEFAULT_MASCOT_FILE;
  return `${MASCOTS_BASE}/${encodeURIComponent(file)}?v=${MASCOT_CACHE_VERSION}`;
}

export function getLoadingMascotSrc(): string {
  return `${MASCOTS_BASE}/${encodeURIComponent(LOADING_MASCOT_FILE)}?v=${MASCOT_CACHE_VERSION}`;
}

export function getLoginScreenMascotSrc(): string {
  return `${MASCOTS_BASE}/${encodeURIComponent(LOGIN_SCREEN_MASCOT_FILE)}?v=${MASCOT_CACHE_VERSION}`;
}

