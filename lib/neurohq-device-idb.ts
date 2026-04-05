/**
 * IndexedDB helper: legacy daily snapshot key + persisted cold-start bootstrap pack per user/day.
 */

import type { DailySnapshot } from "@/types/daily-snapshot";
import type { BootstrapTodayResponse } from "@/lib/daily-snapshot-full-sync";

const DB_NAME = "neurohq-device";
const DB_VERSION = 2;

const STORE_DAILY = "dailySnapshot";
const STORE_HQ = "hqStore";

export const DEVICE_DAILY_SNAPSHOT_ID = "neurohq-daily-snapshot-v1";

/** Single row: last successful daily init for the signed-in user (invalidated on logout / day rollover). */
export const DAILY_INIT_RECORD_ID = "neurohq-daily-init-v3";

export type DailyInitPersistedRow = {
  id: typeof DAILY_INIT_RECORD_ID;
  userId: string;
  /** {@link getSnapshotValidityDayKey} when saved — matches app “day” boundary. */
  validityDayKey: string;
  snapshotVersion: number;
  savedAt: number;
  snapshot: DailySnapshot;
  bootstrapToday: BootstrapTodayResponse | null;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("idb-open-failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_DAILY)) {
        db.createObjectStore(STORE_DAILY, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_HQ)) {
        db.createObjectStore(STORE_HQ, { keyPath: "id" });
      }
    };
  });
}

export async function getDailyInitRecord(): Promise<DailyInitPersistedRow | null> {
  if (typeof indexedDB === "undefined") return null;
  let db: IDBDatabase;
  try {
    db = await openDb();
  } catch {
    return null;
  }
  try {
    return await new Promise<DailyInitPersistedRow | null>((resolve, reject) => {
      const tx = db.transaction(STORE_DAILY, "readonly");
      const req = tx.objectStore(STORE_DAILY).get(DAILY_INIT_RECORD_ID);
      req.onsuccess = () => {
        const v = req.result as DailyInitPersistedRow | undefined;
        resolve(v && typeof v === "object" && v.id === DAILY_INIT_RECORD_ID ? v : null);
      };
      req.onerror = () => reject(req.error ?? new Error("idb-get-failed"));
    });
  } catch {
    return null;
  } finally {
    db.close();
  }
}

export async function putDailyInitRecord(row: DailyInitPersistedRow): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  let db: IDBDatabase;
  try {
    db = await openDb();
  } catch {
    return;
  }
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DAILY, "readwrite");
      tx.objectStore(STORE_DAILY).put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb-put-failed"));
    });
  } catch {
    // quota / private mode
  } finally {
    db.close();
  }
}

export async function clearDeviceDailySnapshot(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  let db: IDBDatabase;
  try {
    db = await openDb();
  } catch {
    return;
  }
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DAILY, "readwrite");
      const store = tx.objectStore(STORE_DAILY);
      store.delete(DEVICE_DAILY_SNAPSHOT_ID);
      store.delete(DAILY_INIT_RECORD_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb-delete-failed"));
    });
  } catch {
    // best-effort
  } finally {
    db.close();
  }
}
