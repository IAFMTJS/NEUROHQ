"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { getTodayKey } from "@/lib/daily-date";
import { generateDailySudoku } from "@/lib/brain-training/sudoku";
import {
  BRAIN_DAILY_CAP,
  applyActivityCompletion,
  getSudokuBoard,
  loadBrainState,
  putBrainState,
  setSudokuBoard,
  syncBrainXpQueue,
  type BrainTrainingState,
  updateQuickTestScore,
} from "@/lib/brain-training/store";

type Props = {
  userId: string;
  initialTotalXp: number;
};

type QuickTestMode = "idle" | "waiting" | "ready" | "result";

export function DailyBrainClient({ userId, initialTotalXp }: Props) {
  const [brainState, setBrainState] = useState<BrainTrainingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [quickTestMode, setQuickTestMode] = useState<QuickTestMode>("idle");
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const quickStartMsRef = useRef<number | null>(null);
  const quickTimeoutRef = useRef<number | null>(null);
  const stateRef = useRef<BrainTrainingState | null>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    stateRef.current = brainState;
  }, [brainState]);

  const persistState = useCallback((next: BrainTrainingState) => {
    setBrainState(next);
    stateRef.current = next;
    void putBrainState(next);
  }, []);

  const runSync = useCallback(async (reason: string) => {
    if (syncingRef.current) return;
    const current = stateRef.current;
    if (!current) return;
    if (current.pendingXpQueue.length === 0) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const { state: synced, acceptedXp } = await syncBrainXpQueue(current);
      persistState(synced);
      if (acceptedXp > 0 && reason !== "interval") {
        neuroToast.success(`Brain sync: +${acceptedXp} XP bevestigd.`);
      }
    } catch {
      const latest = stateRef.current;
      if (latest) {
        persistState({
          ...latest,
          syncRetryCount: latest.syncRetryCount + 1,
        });
      }
      if (reason !== "interval") {
        neuroToast.warning("Sync tijdelijk mislukt. XP blijft lokaal in de queue.");
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [persistState]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const loaded = await loadBrainState(userId, initialTotalXp);
        if (cancelled) return;
        setBrainState(loaded);
        stateRef.current = loaded;
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [initialTotalXp, userId]);

  useEffect(() => {
    if (!brainState) return;
    void runSync("open");
  }, [brainState?.dailyKey, runSync]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void runSync("interval");
    }, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [runSync]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void runSync("visibility");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [runSync]);

  useEffect(() => {
    return () => {
      if (quickTimeoutRef.current != null) {
        window.clearTimeout(quickTimeoutRef.current);
      }
    };
  }, []);

  const todayKey = brainState?.dailyKey ?? getTodayKey();
  const puzzle = useMemo(() => generateDailySudoku(`${userId}:${todayKey}:sudoku`), [todayKey, userId]);
  const board = useMemo(
    () => (brainState ? getSudokuBoard(brainState, puzzle.puzzle) : puzzle.puzzle),
    [brainState, puzzle.puzzle]
  );

  const pendingXp = brainState?.pendingXpQueue.reduce((sum, item) => sum + item.xp, 0) ?? 0;
  const completedCount = (brainState?.sudokuDone ? 1 : 0) + (brainState?.quickTestDone ? 1 : 0);
  const progressPct = Math.round((completedCount / 2) * 100);
  const localTotalXp = brainState?.localTotalXp ?? initialTotalXp;
  const level = Math.floor(localTotalXp / 100) + 1;
  const xpToNext = 100 - (localTotalXp % 100);

  const completeActivity = useCallback(
    async (activity: "sudoku" | "quick_test") => {
      const current = stateRef.current;
      if (!current) return;
      const result = applyActivityCompletion(current, activity, current.dailyKey);
      if (result.skippedReason) {
        neuroToast.info(result.skippedReason);
        return;
      }
      persistState(result.state);
      if (result.appliedXp > 0) {
        neuroToast.success(`+${result.appliedXp} XP verdiend.`);
      }
      if (result.dailyCompletedNow) {
        neuroToast.success(`Daily set voltooid! Streak: ${result.state.streakCount} dag(en).`);
      }
      await runSync("completion");
    },
    [persistState, runSync]
  );

  const onSudokuChange = useCallback(
    (index: number, raw: string) => {
      if (!brainState || brainState.sudokuDone) return;
      if (puzzle.puzzle[index] !== 0) return;
      const value = raw.replace(/[^1-9]/g, "").slice(-1);
      const next = [...board];
      next[index] = value ? Number(value) : 0;
      persistState(setSudokuBoard(brainState, next));
      const solved = next.every((n, idx) => n === puzzle.solution[idx]);
      if (solved) {
        void completeActivity("sudoku");
      }
    },
    [board, brainState, completeActivity, persistState, puzzle.puzzle, puzzle.solution]
  );

  const startQuickTest = useCallback(() => {
    if (quickTimeoutRef.current != null) {
      window.clearTimeout(quickTimeoutRef.current);
      quickTimeoutRef.current = null;
    }
    setReactionMs(null);
    setQuickTestMode("waiting");
    quickStartMsRef.current = null;
    const waitMs = 1400 + Math.floor(Math.random() * 2000);
    quickTimeoutRef.current = window.setTimeout(() => {
      quickStartMsRef.current = performance.now();
      setQuickTestMode("ready");
      quickTimeoutRef.current = null;
    }, waitMs);
  }, []);

  const tapQuickTest = useCallback(() => {
    if (quickTestMode !== "ready") return;
    const started = quickStartMsRef.current;
    if (started == null) return;
    const elapsed = Math.max(0, Math.floor(performance.now() - started));
    setReactionMs(elapsed);
    setQuickTestMode("result");
    const current = stateRef.current;
    if (!current) return;
    persistState(updateQuickTestScore(current, elapsed));
    if (!current.quickTestDone) {
      void completeActivity("quick_test");
    }
  }, [completeActivity, persistState, quickTestMode]);

  if (loading || !brainState) {
    return <div className="card-simple p-4 text-sm text-[var(--text-muted)]">Daily Brain laden...</div>;
  }

  return (
    <div className="space-y-4">
      <section className="card-simple space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Daily Brain</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Level {level}</h2>
          </div>
          <div className="text-right text-xs text-[var(--text-muted)]">
            <p>Streak: <span className="font-semibold text-[var(--text-primary)]">{brainState.streakCount}</span></p>
            <p>Queue: <span className="font-semibold text-[var(--text-primary)]">{pendingXp} XP</span></p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-surface)]">
          <div className="h-full bg-[var(--accent-focus)] transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="grid gap-2 text-xs text-[var(--text-muted)] sm:grid-cols-3">
          <p>Daily progress: <span className="font-semibold text-[var(--text-primary)]">{completedCount}/2</span></p>
          <p>XP vandaag: <span className="font-semibold text-[var(--text-primary)]">{brainState.dailyXpEarned}/{BRAIN_DAILY_CAP}</span></p>
          <p>Tot next level: <span className="font-semibold text-[var(--text-primary)]">{xpToNext} XP</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void runSync("manual")}
            disabled={syncing || pendingXp <= 0}
            className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
          >
            {syncing ? "Syncen..." : "Force sync"}
          </button>
          <p className="text-[11px] text-[var(--text-muted)]">
            {brainState.lastSyncAt ? `Laatste sync: ${new Date(brainState.lastSyncAt).toLocaleTimeString()}` : "Nog geen sync uitgevoerd"}
          </p>
        </div>
      </section>

      <section className="card-simple p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sudoku</h3>
          <span className={`text-xs font-semibold ${brainState.sudokuDone ? "text-emerald-300" : "text-[var(--text-muted)]"}`}>
            {brainState.sudokuDone ? "Voltooid (+50 XP)" : "Niet voltooid"}
          </span>
        </div>
        <div className="grid w-full max-w-[360px] grid-cols-9 gap-1">
          {board.map((value, idx) => {
            const fixed = puzzle.puzzle[idx] !== 0;
            const row = Math.floor(idx / 9);
            const col = idx % 9;
            const borderClass = `${row % 3 === 0 ? "border-t-2" : "border-t"} ${col % 3 === 0 ? "border-l-2" : "border-l"} ${row === 8 ? "border-b-2" : "border-b"} ${col === 8 ? "border-r-2" : "border-r"} border-[var(--card-border)]`;
            return (
              <input
                key={idx}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value === 0 ? "" : String(value)}
                onChange={(e) => onSudokuChange(idx, e.target.value)}
                disabled={fixed || brainState.sudokuDone}
                className={`h-9 w-9 rounded-sm text-center text-sm font-semibold ${borderClass} ${
                  fixed ? "bg-[var(--bg-surface)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] text-[var(--accent-focus)]"
                }`}
              />
            );
          })}
        </div>
      </section>

      <section className="card-simple space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quick Test</h3>
          <span className={`text-xs font-semibold ${brainState.quickTestDone ? "text-emerald-300" : "text-[var(--text-muted)]"}`}>
            {brainState.quickTestDone ? "Voltooid (+20 XP)" : "Niet voltooid"}
          </span>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-3">
          {quickTestMode === "idle" && (
            <p className="text-sm text-[var(--text-secondary)]">Start de reaction test en tap zodra het signaal verschijnt.</p>
          )}
          {quickTestMode === "waiting" && (
            <p className="text-sm font-semibold text-amber-200">Wachten... niet te vroeg klikken.</p>
          )}
          {quickTestMode === "ready" && (
            <button
              type="button"
              onClick={tapQuickTest}
              className="w-full rounded-lg bg-[var(--accent-focus)]/20 px-3 py-2 text-sm font-semibold text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/30"
            >
              TAP NU
            </button>
          )}
          {quickTestMode === "result" && (
            <p className="text-sm text-[var(--text-primary)]">
              Reactietijd: <span className="font-semibold">{reactionMs ?? 0} ms</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <button
            type="button"
            onClick={startQuickTest}
            className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            {brainState.quickTestDone ? "Opnieuw testen" : "Start quick test"}
          </button>
          <p>Beste: <span className="font-semibold text-[var(--text-primary)]">{brainState.quickTestBestMs ?? "—"} ms</span></p>
        </div>
      </section>
    </div>
  );
}
