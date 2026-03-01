/**
 * Persist dashboard payload by date so the PWA can show last-known data
 * immediately when reopened the same day (e.g. after iOS killed the app),
 * then revalidate in the background.
 */

import type { DashboardCritical, DashboardSecondary } from "@/types/dashboard-data.types";

const DB_NAME = "neurohq-dashboard-cache";
const STORE_NAME = "byDate";
const DB_VERSION = 1;

export type DashboardCacheEntry = {
  dateStr: string;
  critical: DashboardCritical;
  secondary: DashboardSecondary;
  cachedAt: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "dateStr" });
      }
    };
  });
}

/** Get cached dashboard for a date (e.g. today). Only use for same calendar day. */
export function getDashboardCache(dateStr: string): Promise<DashboardCacheEntry | null> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(dateStr);
        req.onsuccess = () => {
          db.close();
          const entry = req.result as DashboardCacheEntry | undefined;
          resolve(entry && entry.critical && entry.secondary ? entry : null);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      })
  );
}

/** Store dashboard payload for a date. Overwrites any existing entry for that date. */
export function setDashboardCache(
  dateStr: string,
  critical: DashboardCritical,
  secondary: DashboardSecondary
): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put({ dateStr, critical, secondary, cachedAt: Date.now() });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

/** Today's date in local time YYYY-MM-DD (matches typical dashboard dateStr). */
export function getTodayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
