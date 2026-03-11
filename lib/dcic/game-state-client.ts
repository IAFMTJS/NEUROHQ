"use client";

/**
 * DCIC Game State Client
 * - Reads cached gameState from IndexedDB for instant UI.
 * - Fetches fresh gameState from API and updates cache (stale-while-revalidate).
 */

import { useEffect } from "react";
import type { GameState } from "./types";
import { getCachedGameState, setCachedGameState } from "./game-state-cache";
import { useHQStore } from "@/lib/hq-store";

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
      setGameStateStatus("loading");
      setGameStateError(null);

      // 1. Try local cache first for instant UI
      try {
        const cached = await getCachedGameState();
        if (!cancelled && cached) {
          setGameState(cached);
          setGameStateStatus("ready");
        }
      } catch {
        // Ignore cache errors; we'll still try network
      }

      // 2. Fetch fresh state from API
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
            setError(msg);
            if (status === "idle" || status === "loading") {
              setStatus("error");
            }
          }
          return;
        }
        const fresh = (await res.json()) as GameState;
        if (!cancelled && fresh) {
          setGameState(fresh);
          setGameStateStatus("ready");
        }
        // 3. Update cache in background
        setCachedGameState(fresh).catch(() => {});
      } catch (err) {
        if (!cancelled && !gameState) {
          setGameStateStatus("error");
          setGameStateError(
            err instanceof Error ? err.message : "Failed to load game state"
          );
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

