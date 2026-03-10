/**
 * XP page cache (XP Command Center)
 * Stores last-known XP/identity/insight/forecast snapshot so the XP page
 * can render instantly from IndexedDB and then revalidate via server.
 */

import type { HeatmapDay } from "@/app/actions/dcic/heatmap";
import type { XPForecastItem } from "@/app/actions/dcic/xp-forecast";
import type { InsightEngineState, XPBySourceItem } from "@/app/actions/dcic/insight-engine";
import type { BehaviorProfile } from "@/types/behavior-profile.types";
import type { BrainMode } from "@/lib/brain-mode";
import type { MissionTemplateItem } from "@/components/xp/XPPageContent";

export type XPIdentity = {
  total_xp: number;
  level: number;
  rank: string;
  xp_to_next_level: number;
  next_unlock: { level: number; rank: string; xpNeeded: number };
  streak: { current: number; longest: number; last_completion_date: string | null };
};

export type XPCachePayload = {
  dateStr: string;
  identity: XPIdentity;
  forecast: XPForecastItem[];
  insightState: InsightEngineState | null;
  heatmapDays: { date: string; status: HeatmapDay }[];
  velocity: number;
  chartData: { name: string; value: number; streakOverlay?: number; streakActive?: boolean }[];
  progress: number;
  range: { current: number; needed: number };
  xpLast7: number;
  xpPrevious7: number;
  xpBySource: XPBySourceItem[];
  missionTemplates: MissionTemplateItem[];
  behaviorProfile: BehaviorProfile;
  brainModeToday: BrainMode;
  activeMissionCountToday: number;
};

const DB_NAME = "neurohq-xp-cache";
const STORE_NAME = "byDate";
const DB_VERSION = 1;

type XPCacheEntry = {
  dateStr: string;
  payload: XPCachePayload;
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

export async function getXPCache(dateStr: string): Promise<XPCachePayload | null> {
  const db = await openDB();
  try {
    return await new Promise<XPCachePayload | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(dateStr);
      req.onsuccess = () => {
        const entry = req.result as XPCacheEntry | undefined;
        resolve(entry?.payload ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function setXPCache(dateStr: string, payload: XPCachePayload): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: XPCacheEntry = { dateStr, payload, cachedAt: Date.now() };
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

