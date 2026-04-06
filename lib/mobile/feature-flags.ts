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

export function isSupabaseFirstMobileEnabled(): boolean {
  const enabled = process.env.NEXT_PUBLIC_MOBILE_SYNC_ENABLED;
  if (enabled === "0" || enabled === "false") return false;
  const rollout = envPercent("NEXT_PUBLIC_MOBILE_SYNC_ROLLOUT", 100);
  return readBucket() < rollout;
}

