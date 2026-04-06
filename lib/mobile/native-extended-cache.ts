import { getNativeExtendedKvJson, upsertNativeExtendedKvJson } from "@/lib/mobile/db";
import { isNativeCapacitorRuntime } from "@/lib/mobile/feature-flags";

const BOOTSTRAP_LAST_KEY = "bootstrap_today_last";

export async function getNativeExtendedValue<T>(key: string): Promise<T | null> {
  if (!isNativeCapacitorRuntime()) return null;
  const raw = await getNativeExtendedKvJson(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setNativeExtendedValue(key: string, value: unknown): Promise<void> {
  if (!isNativeCapacitorRuntime()) return;
  await upsertNativeExtendedKvJson(key, JSON.stringify(value ?? null));
}

/** Last successful `/api/bootstrap/today` JSON on device (large SQLite row; native only). */
export async function mirrorBootstrapToNativeExtendedKv(bootstrap: unknown): Promise<void> {
  if (!isNativeCapacitorRuntime()) return;
  await setNativeExtendedValue(BOOTSTRAP_LAST_KEY, bootstrap);
}

export async function readLastMirroredBootstrapFromNative<T = unknown>(): Promise<T | null> {
  return getNativeExtendedValue<T>(BOOTSTRAP_LAST_KEY);
}
