/**
 * Single mascot asset on the dashboard (Commander hero). File lives in `public/mascots/`.
 * Bump MASCOT_CACHE_VERSION when replacing the image so clients bypass browser cache.
 */
const DASHBOARD_MASCOT_FILE = "Homepage Mascotte.png";
const MASCOTS_BASE = "/mascots";
const MASCOT_CACHE_VERSION = 4;

export function getDashboardMascotSrc(): string {
  return `${MASCOTS_BASE}/${encodeURIComponent(DASHBOARD_MASCOT_FILE)}?v=${MASCOT_CACHE_VERSION}`;
}

