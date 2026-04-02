/**
 * Single IndexedDB for PWA durability: daily snapshot + HQ Zustand payload.
 * Same JSON strings as localStorage so eviction/quotas can recover from either layer.
 */

const DB_NAME = "neurohq-device";
const DB_VERSION = 2;

const STORE_DAILY = "dailySnapshot";
const STORE_HQ = "hqStore";

export const DEVICE_DAILY_SNAPSHOT_ID = "neurohq-daily-snapshot-v1";
/** Must match `HQ_PERSIST_KEY` in `hq-store.ts`. */
export const DEVICE_HQ_STORE_ID = "neurohq-hq-store";

type BlobRecord = {
  id: string;
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
      if (!db.objectStoreNames.contains(STORE_DAILY)) {
        db.createObjectStore(STORE_DAILY, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_HQ)) {
        db.createObjectStore(STORE_HQ, { keyPath: "id" });
      }
    };
  });
}

async function putRecord(store: string, id: string, payload: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      const rec: BlobRecord = { id, payload, savedAtMs: Date.now() };
      tx.objectStore(store).put(rec);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb-put-failed"));
      tx.onabort = () => reject(tx.error ?? new Error("idb-put-aborted"));
    });
  } finally {
    db.close();
  }
}

async function getRecord(store: string, id: string): Promise<string | null> {
  if (typeof indexedDB === "undefined") return null;
  let db: IDBDatabase;
  try {
    db = await openDb();
  } catch {
    return null;
  }
  try {
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const r = tx.objectStore(store).get(id);
      r.onsuccess = () => {
        const v = r.result as BlobRecord | undefined;
        resolve(typeof v?.payload === "string" ? v.payload : null);
      };
      r.onerror = () => reject(r.error ?? new Error("idb-get-failed"));
    });
  } catch {
    return null;
  } finally {
    db.close();
  }
}

async function clearRecord(store: string, id: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  let db: IDBDatabase;
  try {
    db = await openDb();
  } catch {
    return;
  }
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb-delete-failed"));
    });
  } catch {
    // best-effort
  } finally {
    db.close();
  }
}

// --- Daily snapshot (same API as before) ---

export async function putDeviceDailySnapshotPayload(payload: string): Promise<void> {
  await putRecord(STORE_DAILY, DEVICE_DAILY_SNAPSHOT_ID, payload);
}

export async function getDeviceDailySnapshotPayload(): Promise<string | null> {
  return getRecord(STORE_DAILY, DEVICE_DAILY_SNAPSHOT_ID);
}

export async function clearDeviceDailySnapshot(): Promise<void> {
  await clearRecord(STORE_DAILY, DEVICE_DAILY_SNAPSHOT_ID);
}

// --- HQ store (Zustand persist JSON) ---

export async function putDeviceHqStorePayload(payload: string): Promise<void> {
  await putRecord(STORE_HQ, DEVICE_HQ_STORE_ID, payload);
}

export async function getDeviceHqStorePayload(): Promise<string | null> {
  return getRecord(STORE_HQ, DEVICE_HQ_STORE_ID);
}

export async function clearDeviceHqStore(): Promise<void> {
  await clearRecord(STORE_HQ, DEVICE_HQ_STORE_ID);
}
