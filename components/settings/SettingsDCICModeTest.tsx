"use client";

import { useMemo, useState } from "react";
import { useDCICGameState } from "@/lib/dcic/game-state-client";
import { setCachedGameState } from "@/lib/dcic/game-state-cache";
import { useHQStore } from "@/lib/hq-store";
import { clearDCICModeOverride, setDCICModeOverride } from "@/lib/dcic/dcic-mode-override";
import { persistDcicOperationalMode } from "@/app/actions/dcic/game-state";
import type { GameState } from "@/lib/dcic/types";

type ModeKey = "war" | "recovery" | "overdrive" | "focus";

async function refreshGameStateFromServer(setGameState: (s: GameState | null) => void) {
  const res = await fetch("/api/dcic/game-state", { credentials: "include", cache: "no-store" });
  if (!res.ok) return;
  const fresh = (await res.json()) as GameState;
  setGameState(fresh);
  await setCachedGameState(fresh);
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
      const res = await persistDcicOperationalMode(mode);
      if (!res.ok) {
        setLastResult(res.error ?? "Server mislukt.");
        return;
      }
      setDCICModeOverride(mode);
      await refreshGameStateFromServer(setGameState);
      setLastResult(`Mode gezet naar ${mode.toUpperCase()} (server opgeslagen).`);
    } catch (e) {
      setLastResult(e instanceof Error ? e.message : "Mode switch mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function triggerFocus() {
    if (busy) return;
    setLastResult(null);
    if (!gameState) {
      setLastResult("Game state nog niet geladen.");
      return;
    }

    try {
      setBusy(true);
      const res = await persistDcicOperationalMode("focus");
      if (!res.ok) {
        setLastResult(res.error ?? "Server mislukt.");
        return;
      }
      clearDCICModeOverride();
      await refreshGameStateFromServer(setGameState);
      setLastResult("Mode teruggezet naar FOCUS/AUTO.");
    } catch (e) {
      setLastResult(e instanceof Error ? e.message : "Reset mislukt.");
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
            Zet de DCIC-modus voor vandaag op de server (inclusief Overdrive) en ververs de lokale cache.
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
          <button
            type="button"
            onClick={() => void triggerMode("overdrive")}
            disabled={!isReady || busy}
            className="rounded-lg border border-[var(--accent-neutral)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            {busy ? "Bezig…" : "Trigger OVERDRIVE"}
          </button>
          <button
            type="button"
            onClick={() => void triggerFocus()}
            disabled={!isReady || busy}
            className="rounded-lg border border-[var(--accent-neutral)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            {busy ? "Bezig…" : "Reset FOCUS"}
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
