"use client";

/**
 * DCIC Game State Client
 * - Reads cached gameState from IndexedDB for instant UI.
 * - Fetches fresh gameState from API and updates cache (stale-while-revalidate).
 *
 * Bootstrap runs once per full page load (module flag). Multiple components call
 * `useDCICGameState()`; without this, each remount (e.g. dashboard shell) would
 * re-run load(), clobber in-memory Overdrive locks with stale IndexedDB, and reset
 * the countdown.
 */

import { useEffect } from "react";
import type { GameState } from "./types";
import { getCachedGameState, setCachedGameState } from "./game-state-cache";
import { useHQStore } from "@/lib/hq-store";
import { applyDCICModeOverrideIfAny } from "./dcic-mode-override";

let dcicGameStateBootstrapDone = false;

/** Set when `StoreHydrator` applied `dcicGameState` from the daily snapshot (same payload as GET /api/dcic/game-state). */
let dcicSeededFromDailySnapshot = false;

/** Call after hydrating DCIC from `DailySnapshot` so the store has instant UI; a fresh `/api/dcic/game-state` fetch still runs. */
export function markDcicSeededFromDailySnapshot(): void {
  dcicSeededFromDailySnapshot = true;
}

/** Call on sign-out so the next session runs a full bootstrap again. */
export function resetDcicGameStateBootstrap(): void {
  dcicGameStateBootstrapDone = false;
  dcicSeededFromDailySnapshot = false;
}

/**
 * If IndexedDB lags behind the in-memory store (e.g. cache write failed), prefer the
 * active Overdrive lock from memory so the UI timer does not jump.
 */
function mergePreferValidOverdriveLock(
  memory: GameState | null,
  incoming: GameState
): GameState {
  const m = memory?.mode;
  const lu = m?.lockedUntil;
  if (
    m?.current === "overdrive" &&
    lu != null &&
    !Number.isNaN(Date.parse(lu)) &&
    Date.parse(lu) > Date.now() &&
    incoming.mode?.current !== "overdrive"
  ) {
    return {
      ...incoming,
      mode: {
        ...incoming.mode,
        current: "overdrive",
        lockedUntil: m.lockedUntil,
        overdriveSessionStart:
          m.overdriveSessionStart ?? incoming.mode.overdriveSessionStart,
      },
    };
  }
  return incoming;
}

export function useDCICGameState() {
  const gameState = useHQStore((s) => s.gameState);
  const status = useHQStore((s) => s.gameStateStatus);
  const error = useHQStore((s) => s.gameStateError);
  const setGameState = useHQStore((s) => s.setGameState);
  const setGameStateStatus = useHQStore((s) => s.setGameStateStatus);
  const setGameStateError = useHQStore((s) => s.setGameStateError);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (dcicGameStateBootstrapDone) {
        return;
      }

      const memoryBeforeLoad = useHQStore.getState().gameState;

      if (dcicSeededFromDailySnapshot) {
        setGameStateStatus("ready");
        setGameStateError(null);
      }

      if (!dcicSeededFromDailySnapshot) {
        setGameStateStatus("loading");
        setGameStateError(null);
      }

      let hadCached = false;

      // 1. Try local cache first for instant UI (skip if bootstrap snapshot already hydrated store)
      if (!dcicSeededFromDailySnapshot) {
        try {
          const cachedRaw = await getCachedGameState();
          if (!cancelled && cachedRaw) {
            const cached = mergePreferValidOverdriveLock(
              memoryBeforeLoad,
              cachedRaw
            );
            applyDCICModeOverrideIfAny(cached);
            setGameState(cached);
            setGameStateStatus("ready");
            hadCached = true;
          }
        } catch {
          // Ignore cache errors; we'll still try network
        }
      }

      // 2. Fetch fresh state from API (always — corrects stale snapshot/cache for Overdrive locks)
      try {
        const res = await fetch("/api/dcic/game-state", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) {
            const body = await res.json().catch(() => ({}));
            const msg =
              typeof body?.error === "string"
                ? body.error
                : `Game state ${res.status}`;
            setGameStateError(msg);
            setGameStateStatus("error");
            dcicGameStateBootstrapDone = true;
          }
          return;
        }
        const fresh = (await res.json()) as GameState;
        if (!cancelled && fresh) {
          applyDCICModeOverrideIfAny(fresh);
          setGameState(fresh);
          setGameStateStatus("ready");
          setCachedGameState(fresh).catch(() => {});
        }
        if (!cancelled) {
          dcicGameStateBootstrapDone = true;
        }
      } catch (err) {
        if (!cancelled && !useHQStore.getState().gameState) {
          setGameStateStatus("error");
          setGameStateError(
            err instanceof Error ? err.message : "Failed to load game state"
          );
        }
        if (!cancelled) {
          dcicGameStateBootstrapDone =
            hadCached || useHQStore.getState().gameState != null;
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // We intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { gameState, status, error };
}

