import { listDashboardMascotWarmUrls } from "@/lib/mascots";

/**
 * Bump when the native warm-cache should invalidate (new art pack, breaking path changes).
 * Stored in SQLite next to per-asset rows; mismatch triggers selective re-fetch.
 */
export const NATIVE_ASSET_PACK_VERSION = 1;

/** Core branding + HUD tab icons + commander mascots (Capacitor Filesystem warm-targets). */
export function getNativeVisualWarmPaths(): string[] {
  const staticPaths = [
    "/offline",
    "/manifest.json",
    "/manifest.webmanifest",
    "/app-icon.png",
    "/logo-naam.png",
    "/icons/hq-tab-dashboard.png",
    "/icons/hq-tab-tasks.png",
    "/icons/hq-tab-budget.png",
    "/icons/hq-tab-report.png",
    "/icons/hq-tab-settings.png",
  ];
  return [...staticPaths, ...listDashboardMascotWarmUrls()];
}
