import { isNativeCapacitorRuntime } from "@/lib/mobile/feature-flags";
import { resolveNativeCachedWebSrc } from "@/lib/mobile/native-fs-cache";

/** Matches `public/` rasters referenced from globals.css and hud.module.css. */
const NATIVE_CSS_ASSET_VARS: ReadonlyArray<readonly [property: string, src: string]> = [
  ["--hq-asset-bg-tiles", "/Background12.PNG"],
  ["--hq-asset-bg-grain", "/grain.PNG"],
  ["--hq-asset-hud-stars", "/stars.png"],
];

function cssUrlValue(resolvedSrc: string): string {
  return `url(${JSON.stringify(resolvedSrc)})`;
}

/**
 * On Capacitor, point CSS custom properties at Filesystem-backed URLs when warmed.
 * Safe on web (no-op). Call after warm completes and once on boot for persisted cache.
 */
export async function applyNativeResolvedCssAssets(): Promise<void> {
  if (typeof document === "undefined" || !isNativeCapacitorRuntime()) return;
  const root = document.documentElement;
  await Promise.all(
    NATIVE_CSS_ASSET_VARS.map(async ([prop, src]) => {
      const resolved = await resolveNativeCachedWebSrc(src);
      if (resolved !== src) root.style.setProperty(prop, cssUrlValue(resolved));
    })
  );
}
