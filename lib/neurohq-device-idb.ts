/**
 * IndexedDB helper: clear legacy daily snapshot mirror (client snapshot persistence is disabled).
 */

const DB_NAME = "neurohq-device";
const DB_VERSION = 2;

const STORE_DAILY = "dailySnapshot";
const STORE_HQ = "hqStore";

export const DEVICE_DAILY_SNAPSHOT_ID = "neurohq-daily-snapshot-v1";

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
      tx.objectStore(STORE_DAILY).delete(DEVICE_DAILY_SNAPSHOT_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb-delete-failed"));
    });
  } catch {
    // best-effort
  } finally {
    db.close();
  }
}
