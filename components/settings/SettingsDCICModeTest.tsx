"use client";

import { useMemo, useState } from "react";
import { useDCICGameState } from "@/lib/dcic/game-state-client";
import { switchMode } from "@/lib/dcic/mode-engine";
import { setCachedGameState } from "@/lib/dcic/game-state-cache";
import { useHQStore } from "@/lib/hq-store";

type ModeKey = "war" | "recovery" | "focus";

function cloneGameState<T>(state: T): T {
  // structuredClone is supported in modern browsers; fallback for older runtimes.
  if (typeof structuredClone === "function") return structuredClone(state);
  return JSON.parse(JSON.stringify(state)) as T;
}

export function SettingsDCICModeTest() {
  const { gameState, status, error } = useDCICGameState();
  const setGameState = useHQStore((s) => s.setGameState);

  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const currentMode = useMemo(() => gameState?.mode.current ?? "focus", [gameState?.mode.current]);

  async function triggerMode(mode: Exclude<ModeKey, "focus">) {
    if (busy) return;
    setLastResult(null);
    if (!gameState) {
      setLastResult("Game state nog niet geladen.");
      return;
    }

    try {
      setBusy(true);

      // switchMode mutates input; clone first to avoid mutating zustand state in-place.
      const next = cloneGameState(gameState);
      switchMode(next, mode, { forced: true });

      setGameState(next);
      await setCachedGameState(next); // keep IndexedDB cache in sync for reloads

      const locked = next.mode.lockedUntil ? ` (locked tot ${next.mode.lockedUntil})` : "";
      setLastResult(`Mode gezet naar ${mode.toUpperCase()}${locked}`);
    } catch (e) {
      setLastResult(e instanceof Error ? e.message : "Mode switch mislukt.");
    } finally {
      setBusy(false);
    }
  }

  const isReady = status === "ready" && !!gameState;

  return (
    <div className="card-simple p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">DCIC test knoppen</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Tijdelijke debug: zet alleen de lokale DCIC mode (war/recovery) en update ook de lokale cache. Niet bedoeld voor productie.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--text-muted)]">Huidige mode</div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">{currentMode.toUpperCase()}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void triggerMode("war")}
            disabled={!isReady || busy}
            className="rounded-lg border border-[var(--accent-neutral)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            {busy ? "Bezig…" : "Trigger WAR"}
          </button>
          <button
            type="button"
            onClick={() => void triggerMode("recovery")}
            disabled={!isReady || busy}
            className="rounded-lg border border-[var(--accent-neutral)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            {busy ? "Bezig…" : "Trigger RECOVERY"}
          </button>
        </div>

        <div className="text-xs text-[var(--text-muted)]">
          {status === "loading" ? "Bezig met laden…" : error ? `Error: ${error}` : null}
        </div>
      </div>

      {lastResult && <div className="mt-3 text-sm text-[var(--text-secondary)]">{lastResult}</div>}
    </div>
  );
}

