/**
 * Profile home bundle cache (Profile page)
 * Stores last-known profile-home snapshot so the Profile page can render instantly
 * from IndexedDB and then revalidate via server.
 */

import type { ProfileHomeBundle } from "@/lib/profile-home-types";

const DB_NAME = "neurohq-profile-home-cache";
const STORE_NAME = "byUserAndDate";
const DB_VERSION = 1;

type ProfileHomeCacheEntry = {
  key: string; // `${userId}:${dateStr}`
  userId: string;
  dateStr: string;
  payload: ProfileHomeBundle;
  cachedAt: number;
};

function makeKey(userId: string, dateStr: string) {
  return `${userId}:${dateStr}`;
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

export async function getProfileHomeCache(userId: string, dateStr: string): Promise<ProfileHomeBundle | null> {
  const db = await openDB();
  try {
    const key = makeKey(userId, dateStr);
    return await new Promise<ProfileHomeBundle | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result as ProfileHomeCacheEntry | undefined;
        resolve(entry?.payload ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function setProfileHomeCache(userId: string, dateStr: string, payload: ProfileHomeBundle): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: ProfileHomeCacheEntry = {
        key: makeKey(userId, dateStr),
        userId,
        dateStr,
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

