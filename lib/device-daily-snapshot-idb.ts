/**
 * IndexedDB mirror for the daily snapshot JSON (same bytes as `localStorage`).
 * Improves PWA durability: larger quota than localStorage alone and separate eviction heuristics.
 */

const DB_NAME = "neurohq-device";
const DB_VERSION = 1;
const STORE_NAME = "dailySnapshot";
const RECORD_ID = "neurohq-daily-snapshot-v1";

type SnapshotRecord = {
  id: typeof RECORD_ID;
  payload: string;
  savedAtMs: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("idb-open-failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/** Persists the exact payload string already verified in localStorage. */
export async function putDeviceDailySnapshotPayload(payload: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const rec: SnapshotRecord = {
        id: RECORD_ID,
        payload,
        savedAtMs: Date.now(),
      };
      tx.objectStore(STORE_NAME).put(rec);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb-put-failed"));
      tx.onabort = () => reject(tx.error ?? new Error("idb-put-aborted"));
    });
  } finally {
    db.close();
  }
}

export async function getDeviceDailySnapshotPayload(): Promise<string | null> {
  if (typeof indexedDB === "undefined") return null;
  let db: IDBDatabase;
  try {
    db = await openDb();
  } catch {
    return null;
  }
  try {
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(RECORD_ID);
      req.onsuccess = () => {
        const v = req.result as SnapshotRecord | undefined;
        resolve(typeof v?.payload === "string" ? v.payload : null);
      };
      req.onerror = () => reject(req.error ?? new Error("idb-get-failed"));
    });
  } catch {
    return null;
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
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(RECORD_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb-delete-failed"));
    });
  } catch {
    // best-effort
  } finally {
    db.close();
  }
}
