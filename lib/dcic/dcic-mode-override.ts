"use client";

import { getTodayKey } from "@/lib/daily-date";
import type { GameState } from "./types";
import { switchMode } from "./mode-engine";

export type DCICModeOverride = "war" | "recovery" | "focus";

const STORAGE_KEY = "neurohq-dcic-mode-override-v1";

type StoredOverride = {
  dateKey: string; // YYYY-MM-DD (local)
  mode: DCICModeOverride;
  setAt: number; // epoch ms
};

function safeParseStoredOverride(raw: string | null): StoredOverride | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredOverride>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.dateKey !== "string") return null;
    if (parsed.dateKey !== getTodayKey()) return null;
    if (parsed.mode !== "war" && parsed.mode !== "recovery" && parsed.mode !== "focus") return null;
    if (typeof parsed.setAt !== "number" || !Number.isFinite(parsed.setAt)) return null;
    return parsed as StoredOverride;
  } catch {
    return null;
  }
}

export function readDCICModeOverride(): StoredOverride | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return safeParseStoredOverride(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function setDCICModeOverride(mode: DCICModeOverride): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const payload: StoredOverride = {
      dateKey: getTodayKey(),
      mode,
      setAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // best-effort only
  }
}

export function clearDCICModeOverride(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort only
  }
}

/**
 * Applies the local override to a gameState in-place.
 * Used to keep the "mode of the day" stable while the app periodically refetches game state.
 */
export function applyDCICModeOverrideIfAny(gameState: GameState): void {
  const override = readDCICModeOverride();
  if (!override) return;
  if (!gameState?.mode) return;

  // switchMode mutates and also sets lock metadata correctly.
  if (gameState.mode.current !== override.mode) {
    switchMode(gameState, override.mode, { forced: true });
  }
}

