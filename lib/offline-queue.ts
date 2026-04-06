/**
 * Offline-first: queue mutations in IndexedDB and sync when online.
 * Store: neurohq-pending with { id, action, payload, createdAt }.
 *
 * In the Capacitor native app with mobile sync enabled, known task mutations are
 * written to the SQLite outbox instead (durable + same push API as the rest of native sync).
 */

import { isSupabaseFirstMobileEnabled } from "@/lib/mobile/feature-flags";
import { mapLegacyQueueToOutbox } from "@/lib/mobile/legacy-queue-bridge";
import { enqueueOutboxAction } from "@/lib/mobile/outbox";
import { flushOutboxQueue } from "@/lib/mobile/sync-engine";

const DB_NAME = "neurohq-offline-actions";
const STORE_NAME = "pendingActions";
const DB_VERSION = 1;

export type QueuedEntry = {
  id: string;
  action: string;
  payload: unknown;
  createdAt: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function addToQueue(action: string, payload: unknown): Promise<void> {
  if (isSupabaseFirstMobileEnabled()) {
    const mapped = mapLegacyQueueToOutbox(action, payload);
    if (mapped) {
      await enqueueOutboxAction(mapped);
      await flushOutboxQueue();
      return;
    }
  }

  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const id = `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    store.add({ id, action, payload, createdAt: Date.now() });
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export function getQueue(): Promise<QueuedEntry[]> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => { db.close(); resolve(req.result ?? []); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  });
}

export function removeFromQueue(id: string): Promise<void> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  });
}

export function clearQueue(): Promise<void> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  });
}
