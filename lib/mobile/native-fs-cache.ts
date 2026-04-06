import {
  clearNativeAssetRegistry,
  getNativeAssetRegistryRow,
  isNativeSqliteDatabaseAvailable,
  upsertNativeAssetRegistryRow,
} from "@/lib/mobile/db";
import type { NativeAssetRegistryRow } from "@/lib/mobile/schema";
import { isNativeCapacitorRuntime } from "@/lib/mobile/feature-flags";
import { getNativeVisualWarmPaths, NATIVE_ASSET_PACK_VERSION } from "@/lib/mobile/native-asset-manifest";
import { getNativeExtendedValue, setNativeExtendedValue } from "@/lib/mobile/native-extended-cache";

const PACK_META_KEY = "native_asset_pack_version";
const FS_ROOT_PREFIX = "neurohq/fs-assets";

function toAbsoluteAssetUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  const path = src.startsWith("/") ? src : `/${src}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

/** Stable registry key: pathname + search (no origin). */
export function assetUrlKeyFromAbsolute(absoluteUrl: string): string {
  try {
    const u = new URL(absoluteUrl);
    return `${u.pathname}${u.search}`;
  } catch {
    return absoluteUrl.split("#")[0] ?? absoluteUrl;
  }
}

function fsSubpathFromUrlKey(urlKey: string): string {
  const safe = urlKey
    .replace(/^\//, "")
    .replace(/\//g, "__")
    .replace(/\?/g, "_q_")
    .replace(/&/g, "_a_")
    .replace(/=/g, "_eq_")
    .replace(/%/g, "pct");
  return `${FS_ROOT_PREFIX}/${safe}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchOneVisual(
  absoluteUrl: string,
  Filesystem: typeof import("@capacitor/filesystem").Filesystem,
  Directory: typeof import("@capacitor/filesystem").Directory
): Promise<void> {
  const urlKey = assetUrlKeyFromAbsolute(absoluteUrl);
  const fsSubpath = fsSubpathFromUrlKey(urlKey);
  const res = await fetch(absoluteUrl, { credentials: "include", cache: "no-store" });
  if (!res.ok) return;

  const etag = res.headers.get("etag");
  const contentType = res.headers.get("content-type");
  const existing = await getNativeAssetRegistryRow(urlKey);
  if (existing?.etag && etag && existing.etag === etag && existing.fsSubpath === fsSubpath) {
    try {
      await Filesystem.stat({ path: existing.fsSubpath, directory: Directory.Data });
      return;
    } catch {
      // missing on disk — re-download
    }
  }

  const buf = await res.arrayBuffer();
  const byteLength = buf.byteLength;
  if (byteLength === 0) return;

  const base64 = arrayBufferToBase64(buf);
  await Filesystem.writeFile({
    path: fsSubpath,
    data: base64,
    directory: Directory.Data,
    recursive: true,
  });

  const row: NativeAssetRegistryRow = {
    urlKey,
    fsSubpath,
    etag,
    contentType,
    byteLength,
    fetchedAt: Date.now(),
  };
  await upsertNativeAssetRegistryRow(row);
}

/**
 * Downloads core visuals into app-private storage and registers them in SQLite.
 * Safe to call repeatedly (ETag + stat short-circuit).
 */
export async function warmNativeVisualAssetCache(): Promise<void> {
  if (typeof window === "undefined" || !isNativeCapacitorRuntime()) return;
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.getPlatform() !== "ios" && Capacitor.getPlatform() !== "android") return;
  if (!(await isNativeSqliteDatabaseAvailable())) return;

  const { Filesystem, Directory } = await import("@capacitor/filesystem");

  const storedPack = await getNativeExtendedValue<number>(PACK_META_KEY);
  if (storedPack !== NATIVE_ASSET_PACK_VERSION) {
    await clearNativeAssetRegistry();
    await setNativeExtendedValue(PACK_META_KEY, NATIVE_ASSET_PACK_VERSION);
  }

  const paths = getNativeVisualWarmPaths();
  const concurrency = 4;
  for (let i = 0; i < paths.length; i += concurrency) {
    const slice = paths.slice(i, i + concurrency);
    await Promise.all(
      slice.map((p) =>
        fetchOneVisual(toAbsoluteAssetUrl(p), Filesystem, Directory).catch(() => {
          // ignore per-asset failures (404, offline, etc.)
        })
      )
    );
  }
}

/**
 * If the asset is registered on disk, returns a WebView-loadable URL via `convertFileSrc`.
 * Otherwise returns `src` unchanged (network / relative URL).
 */
export async function resolveNativeCachedWebSrc(src: string): Promise<string> {
  if (typeof window === "undefined" || !isNativeCapacitorRuntime()) return src;
  try {
    const abs = toAbsoluteAssetUrl(src);
    const urlKey = assetUrlKeyFromAbsolute(abs);
    const row = await getNativeAssetRegistryRow(urlKey);
    if (!row) return src;
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    await Filesystem.stat({ path: row.fsSubpath, directory: Directory.Data });
    const { uri } = await Filesystem.getUri({
      path: row.fsSubpath,
      directory: Directory.Data,
    });
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.convertFileSrc(uri);
  } catch {
    return src;
  }
}
