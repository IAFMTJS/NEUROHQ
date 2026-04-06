/**
 * Dashboard Commander hero mascots live in `public/mascots/`.
 * Bump MASCOT_CACHE_VERSION when replacing images so clients bypass browser cache.
 */
const MASCOTS_BASE = "/mascots";
const MASCOT_CACHE_VERSION = 5;

/** DCIC operational mode; extra modes use dedicated artwork + shell `data-mode` glow tokens. */
export type DashboardMascotMode = "focus" | "war" | "recovery" | "overdrive";

const DEFAULT_MASCOT_FILE = "Homepage Mascotte.png";

const MODE_MASCOT_FILE: Partial<Record<DashboardMascotMode, string>> = {
  war: "War Mode Mascotte.png",
  recovery: "Recovery Mode Mascotte.png",
  overdrive: "Overdrive Mode Mascotte.png",
};

export function getDashboardMascotSrc(mode?: DashboardMascotMode | null): string {
  const file = (mode && MODE_MASCOT_FILE[mode]) || DEFAULT_MASCOT_FILE;
  return `${MASCOTS_BASE}/${encodeURIComponent(file)}?v=${MASCOT_CACHE_VERSION}`;
}

