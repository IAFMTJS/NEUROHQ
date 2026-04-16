import type { HubBundleDomain, HubBundlePayloadByDomain } from "@/lib/hub-bundles/types";

const DB_NAME = "neurohq-hub-bundles";
const STORE_NAME = "byUserAndDateAndDomain";
const DB_VERSION = 1;

type HubBundleCacheEntry<K extends HubBundleDomain = HubBundleDomain> = {
  key: string; // `${userId}:${dateStr}:${domain}`
  userId: string;
  dateStr: string;
  domain: K;
  payload: HubBundlePayloadByDomain[K];
  cachedAt: number;
};

function makeKey(userId: string, dateStr: string, domain: HubBundleDomain) {
  return `${userId}:${dateStr}:${domain}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
  });
}

export async function getHubBundle<K extends HubBundleDomain>(
  domain: K,
  userId: string,
  dateStr: string
): Promise<HubBundlePayloadByDomain[K] | null> {
  const db = await openDB();
  try {
    const key = makeKey(userId, dateStr, domain);
    return await new Promise<HubBundlePayloadByDomain[K] | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result as HubBundleCacheEntry<K> | undefined;
        resolve(entry?.payload ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function setHubBundle<K extends HubBundleDomain>(
  domain: K,
  userId: string,
  dateStr: string,
  payload: HubBundlePayloadByDomain[K]
): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: HubBundleCacheEntry<K> = {
        key: makeKey(userId, dateStr, domain),
        userId,
        dateStr,
        domain,
        payload,
        cachedAt: Date.now(),
      };
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

