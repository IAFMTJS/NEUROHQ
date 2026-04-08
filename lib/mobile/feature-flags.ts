const DEVICE_BUCKET_KEY = "neurohq-mobile-rollout-bucket-v1";

function readBucket(): number {
  if (typeof window === "undefined") return 0;
  try {
    const existing = window.localStorage.getItem(DEVICE_BUCKET_KEY);
    if (existing) {
      const n = Number(existing);
      if (Number.isFinite(n) && n >= 0 && n <= 99) return Math.floor(n);
    }
    const bucket = Math.floor(Math.random() * 100);
    window.localStorage.setItem(DEVICE_BUCKET_KEY, String(bucket));
    return bucket;
  } catch {
    return 0;
  }
}

function envPercent(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.floor(value)));
}

/** True when running inside the Capacitor native shell (iOS/Android), not mobile Safari/PWA. */
export function isNativeCapacitorRuntime(): boolean {
  if (typeof window === "undefined") return false;
  const maybeCapacitor = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (!maybeCapacitor || typeof maybeCapacitor.isNativePlatform !== "function") return false;
  try {
    return maybeCapacitor.isNativePlatform() === true;
  } catch {
    return false;
  }
}

/**
 * Supabase-first offline queue + entity cache (IndexedDB in browser/PWA, SQLite on native).
 *
 * - Native Capacitor: set NEXT_PUBLIC_MOBILE_SYNC_ENABLED=1 (and optional ROLLOUT).
 * - Browser/PWA: zet daarnaast NEXT_PUBLIC_MOBILE_SYNC_PWA=1 zodat dezelfde outbox/cache-pad
 *   actief is zonder native shell (aanbevolen zolang de store-app nog niet live is).
 */
export function isSupabaseFirstMobileEnabled(): boolean {
  const enabled = process.env.NEXT_PUBLIC_MOBILE_SYNC_ENABLED;
  if (enabled !== "1" && enabled !== "true") return false;

  const native = isNativeCapacitorRuntime();
  const pwaFlag = process.env.NEXT_PUBLIC_MOBILE_SYNC_PWA;
  const pwaAllowed = pwaFlag === "1" || pwaFlag === "true";
  if (!native && !pwaAllowed) return false;

  const rollout = envPercent("NEXT_PUBLIC_MOBILE_SYNC_ROLLOUT", 100);
  return readBucket() < rollout;
}

