/**
 * Client-side cache for DCIC gameState in IndexedDB.
 * Mirrors the PWA architecture: UI reads from local cache first, then syncs with Supabase via API.
 */

import type { GameState } from "./types";

const DB_NAME = "neurohq-game-state";
const STORE_NAME = "state";
const DB_VERSION = 1;
const SINGLETON_KEY = "current"; // one gameState per logged-in user/session

type GameStateEntry = {
  id: string;
  state: GameState;
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
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function getCachedGameState(): Promise<GameState | null> {
  const db = await openDB();
  try {
    return await new Promise<GameState | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(SINGLETON_KEY);
      req.onsuccess = () => {
        const entry = req.result as GameStateEntry | undefined;
        resolve(entry?.state ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function setCachedGameState(state: GameState): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: GameStateEntry = {
        id: SINGLETON_KEY,
        state,
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

