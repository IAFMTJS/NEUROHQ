"use client";

import { clearDeviceDailySnapshot } from "@/lib/neurohq-device-idb";

const STORAGE_KEY = "neurohq-daily-snapshot-v1";

/**
 * Best-effort cleanup of legacy daily snapshot keys (localStorage + IndexedDB).
 * In-memory bootstrap does not read these anymore; call before reload if you want a clean device state.
 */
export async function clearDailySnapshot(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[daily-snapshot] clearDailySnapshot localStorage failed", err);
  }
  try {
    await clearDeviceDailySnapshot();
  } catch (err) {
    console.warn("[daily-snapshot] clearDeviceDailySnapshot failed", err);
  }
}
