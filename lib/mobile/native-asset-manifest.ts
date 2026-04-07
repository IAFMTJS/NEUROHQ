import { listDashboardMascotWarmUrls } from "@/lib/mascots";

/**
 * Bump when the native warm-cache should invalidate (new art pack, breaking path changes).
 * Stored in SQLite next to per-asset rows; mismatch triggers selective re-fetch.
 */
export const NATIVE_ASSET_PACK_VERSION = 3;

/** Matches `BOTTOM_NAV_LINKS` in lib/navigation/bottom-nav-links.tsx (PNG paths). */
const BOTTOM_NAV_WARM_PATHS: string[] = [
  "/nav/Missions.png",
  "/nav/Budget.png",
  "/nav/Growth.png",
  "/nav/Dashboard.png",
  "/nav/Strategy.png",
  "/Icons/User.PNG",
  "/nav/Settings.png",
];

/** Branding + bottom-nav PNGs: warm first so tabs and logos resolve from disk quickly. */
export function getNativeVisualCriticalWarmPaths(): string[] {
  return ["/app-icon.png", "/logo-naam.png", ...BOTTOM_NAV_WARM_PATHS];
}

/** Large rasters used as CSS backgrounds (dashboard + HUD test). Warmed in full pass. */
export function getNativeAmbientTextureWarmPaths(): string[] {
  return ["/Background12.PNG", "/grain.PNG", "/stars.png"];
}

/** Critical paths + PWA shell + ambient textures + commander mascots. */
export function getNativeVisualWarmPaths(): string[] {
  const staticPaths = ["/offline", "/manifest.json", "/manifest.webmanifest"];
  return [
    ...getNativeVisualCriticalWarmPaths(),
    ...staticPaths,
    ...getNativeAmbientTextureWarmPaths(),
    ...listDashboardMascotWarmUrls(),
  ];
}
