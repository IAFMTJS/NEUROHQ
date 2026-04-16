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
  updateChoiceRtResult,
} from "@/lib/brain-training/store";
import { StroopGame } from "@/components/brain/games/StroopGame";
import { SequenceRecallGame } from "@/components/brain/games/SequenceRecallGame";
import { TileMergeGame } from "@/components/brain/games/TileMergeGame";
import { WordScrambleGame } from "@/components/brain/games/WordScrambleGame";

type Props = {
  userId: string;
  initialTotalXp: number;
};

type ChoiceRtMode = "idle" | "waiting" | "ready" | "result";

export function DailyBrainClient({ userId, initialTotalXp }: Props) {
  const [brainState, setBrainState] = useState<BrainTrainingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [choiceRtMode, setChoiceRtMode] = useState<ChoiceRtMode>("idle");
  const [choiceRtTrial, setChoiceRtTrial] = useState(0);
  const [choiceRtWrong, setChoiceRtWrong] = useState(0);
  const [choiceRtTimes, setChoiceRtTimes] = useState<number[]>([]);
  const [choiceRtCue, setChoiceRtCue] = useState<"L" | "R" | null>(null);
  const [hintFlashIndex, setHintFlashIndex] = useState<number | null>(null);
  const choiceStartMsRef = useRef<number | null>(null);
  const choiceTimeoutRef = useRef<number | null>(null);
  const hintFlashTimeoutRef = useRef<number | null>(null);
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
      if (choiceTimeoutRef.current != null) {
        window.clearTimeout(choiceTimeoutRef.current);
      }
      if (hintFlashTimeoutRef.current != null) {
        window.clearTimeout(hintFlashTimeoutRef.current);
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
  const totalGames = 6;
  const completedCount =
    (brainState?.sudokuDone ? 1 : 0) +
    (brainState?.choiceRtDone ? 1 : 0) +
    (brainState?.stroopDone ? 1 : 0) +
    (brainState?.sequenceRecallDone ? 1 : 0) +
    (brainState?.tileMergeDone ? 1 : 0) +
    (brainState?.wordScrambleDone ? 1 : 0);
  const progressPct = Math.round((completedCount / totalGames) * 100);
  const localTotalXp = brainState?.localTotalXp ?? initialTotalXp;
  const level = Math.floor(localTotalXp / 100) + 1;
  const xpToNext = 100 - (localTotalXp % 100);

  const completeActivity = useCallback(
    async (activity: "sudoku" | "choice_rt" | "stroop" | "sequence_recall" | "tile_merge" | "word_scramble") => {
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

  const applyHint = useCallback(() => {
    if (!brainState || brainState.sudokuDone) return;
    const candidates: number[] = [];
    for (let i = 0; i < 81; i += 1) {
      if (puzzle.puzzle[i] !== 0) continue;
      if (board[i] !== puzzle.solution[i]) candidates.push(i);
    }
    if (candidates.length === 0) {
      neuroToast.info("Geen hint nodig: dit bord klopt al (of is opgelost).");
      return;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)]!;
    const next = [...board];
    next[pick] = puzzle.solution[pick] ?? 0;
    persistState(setSudokuBoard(brainState, next));

    setHintFlashIndex(pick);
    if (hintFlashTimeoutRef.current != null) {
      window.clearTimeout(hintFlashTimeoutRef.current);
    }
    hintFlashTimeoutRef.current = window.setTimeout(() => {
      setHintFlashIndex(null);
      hintFlashTimeoutRef.current = null;
    }, 900);

    if (next.every((n, idx) => n === puzzle.solution[idx])) {
      void completeActivity("sudoku");
    }
  }, [board, brainState, completeActivity, persistState, puzzle.puzzle, puzzle.solution]);

  const scheduleChoiceCue = useCallback(() => {
    setChoiceRtCue(null);
    choiceStartMsRef.current = null;
    const waitMs = 800 + Math.floor(Math.random() * 1600);
    if (choiceTimeoutRef.current != null) {
      window.clearTimeout(choiceTimeoutRef.current);
    }
    choiceTimeoutRef.current = window.setTimeout(() => {
      const cue = Math.random() < 0.5 ? "L" : "R";
      setChoiceRtCue(cue);
      choiceStartMsRef.current = performance.now();
      setChoiceRtMode("ready");
      choiceTimeoutRef.current = null;
    }, waitMs);
  }, []);

  const startChoiceRt = useCallback(() => {
    setChoiceRtTrial(0);
    setChoiceRtWrong(0);
    setChoiceRtTimes([]);
    setChoiceRtMode("waiting");
    scheduleChoiceCue();
  }, [scheduleChoiceCue]);

  const answerChoiceRt = useCallback(
    (answer: "L" | "R") => {
      if (choiceRtMode !== "ready") return;
      const started = choiceStartMsRef.current;
      if (started == null || choiceRtCue == null) return;
      const elapsed = Math.max(0, Math.floor(performance.now() - started));
      setChoiceRtTimes((prev) => [...prev, elapsed]);
      setChoiceRtTrial((prev) => prev + 1);
      if (answer !== choiceRtCue) setChoiceRtWrong((prev) => prev + 1);

      const nextTrial = choiceRtTrial + 1;
      const totalTrials = 12;
      if (nextTrial >= totalTrials) {
        setChoiceRtMode("result");
        const timesNext = [...choiceRtTimes, elapsed];
        const avg = timesNext.reduce((s, t) => s + t, 0) / Math.max(1, timesNext.length);
        const wrong = (answer !== choiceRtCue ? choiceRtWrong + 1 : choiceRtWrong);
        const current = stateRef.current;
        if (!current) return;
        persistState(updateChoiceRtResult(current, avg, wrong));
        if (!current.choiceRtDone) {
          void completeActivity("choice_rt");
        }
        return;
      }
      setChoiceRtMode("waiting");
      scheduleChoiceCue();
    },
    [
      choiceRtCue,
      choiceRtMode,
      choiceRtTrial,
      choiceRtTimes,
      choiceRtWrong,
      completeActivity,
      persistState,
      scheduleChoiceCue,
    ]
  );

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
          <p>Daily progress: <span className="font-semibold text-[var(--text-primary)]">{completedCount}/{totalGames}</span></p>
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
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyHint}
            disabled={brainState.sudokuDone}
            className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
          >
            Hint
          </button>
          <p className="text-[11px] text-[var(--text-muted)]">Vult één correcte cel in als je vastzit.</p>
        </div>

        <div className="relative w-full max-w-[360px] overflow-hidden rounded-lg border-2 border-[var(--card-border)]">
          <div className="grid grid-cols-9">
            {board.map((value, idx) => {
              const fixed = puzzle.puzzle[idx] !== 0;
              const row = Math.floor(idx / 9);
              const col = idx % 9;
              const cellBorder = "border border-[var(--card-border)]";
              const overlap = `${row === 0 ? "" : "-mt-px"} ${col === 0 ? "" : "-ml-px"}`;
              const hintFlash = hintFlashIndex === idx;
              return (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={value === 0 ? "" : String(value)}
                  onChange={(e) => onSudokuChange(idx, e.target.value)}
                  disabled={fixed || brainState.sudokuDone}
                  className={[
                    "h-9 w-9 text-center text-sm font-semibold outline-none transition-colors",
                    cellBorder,
                    overlap,
                    fixed ? "bg-[var(--bg-surface)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] text-[var(--accent-focus)]",
                    hintFlash ? "relative z-10 bg-amber-200/20 ring-2 ring-amber-200" : "",
                    !fixed && !brainState.sudokuDone ? "focus:ring-2 focus:ring-[var(--accent-focus)]/60" : "",
                  ].join(" ")}
                />
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-y-0 left-1/3 w-[3px] bg-[var(--text-primary)]/25" />
            <div className="absolute inset-y-0 left-2/3 w-[3px] bg-[var(--text-primary)]/25" />
            <div className="absolute inset-x-0 top-1/3 h-[3px] bg-[var(--text-primary)]/25" />
            <div className="absolute inset-x-0 top-2/3 h-[3px] bg-[var(--text-primary)]/25" />
          </div>
        </div>
      </section>

      <section className="card-simple space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Choice Reaction</h3>
          <span className={`text-xs font-semibold ${brainState.choiceRtDone ? "text-emerald-300" : "text-[var(--text-muted)]"}`}>
            {brainState.choiceRtDone ? "Voltooid (+30 XP)" : "Niet voltooid"}
          </span>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-3">
          {choiceRtMode === "idle" && (
            <p className="text-sm text-[var(--text-secondary)]">Start de test. Druk links/rechts zodra de pijl verschijnt.</p>
          )}
          {choiceRtMode === "waiting" && (
            <p className="text-sm font-semibold text-amber-200">Wachten... focus.</p>
          )}
          {choiceRtMode === "ready" && (
            <div className="space-y-3">
              <div className="text-center text-3xl font-semibold text-[var(--text-primary)]">{choiceRtCue === "L" ? "←" : "→"}</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => answerChoiceRt("L")}
                  className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                  Links
                </button>
                <button
                  type="button"
                  onClick={() => answerChoiceRt("R")}
                  className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                  Rechts
                </button>
              </div>
              <p className="text-center text-[11px] text-[var(--text-muted)]">Trial {choiceRtTrial + 1}/12</p>
            </div>
          )}
          {choiceRtMode === "result" && (
            <div className="space-y-1 text-sm text-[var(--text-primary)]">
              <p>
                Gemiddelde:{" "}
                <span className="font-semibold">{brainState.choiceRtLastAvgMs ?? Math.round(choiceRtTimes.reduce((s, t) => s + t, 0) / Math.max(1, choiceRtTimes.length))} ms</span>
              </p>
              <p>
                Fouten: <span className="font-semibold">{brainState.choiceRtLastWrong ?? choiceRtWrong}</span>
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <button
            type="button"
            onClick={startChoiceRt}
            className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            {brainState.choiceRtDone ? "Opnieuw testen" : "Start test"}
          </button>
          <p>Beste: <span className="font-semibold text-[var(--text-primary)]">{brainState.choiceRtBestMs ?? "—"} ms</span></p>
        </div>
      </section>

      <StroopGame brainState={brainState} persistState={persistState} completeActivity={completeActivity} userId={userId} />
      <SequenceRecallGame brainState={brainState} persistState={persistState} completeActivity={completeActivity} userId={userId} />
      <TileMergeGame brainState={brainState} persistState={persistState} completeActivity={completeActivity} userId={userId} />
      <WordScrambleGame brainState={brainState} persistState={persistState} completeActivity={completeActivity} userId={userId} />
    </div>
  );
}
