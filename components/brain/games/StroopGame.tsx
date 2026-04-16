"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTodayKey } from "@/lib/daily-date";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { updateStroopScore, type BrainTrainingState } from "@/lib/brain-training/store";
import { seededRng } from "@/components/brain/games/_shared";

type Props = {
  userId: string;
  brainState: BrainTrainingState;
  persistState: (next: BrainTrainingState) => void;
  completeActivity: (activity: "stroop") => Promise<void>;
};

const COLORS = [
  { id: "red", label: "Rood", className: "text-red-300" },
  { id: "green", label: "Groen", className: "text-emerald-300" },
  { id: "blue", label: "Blauw", className: "text-sky-300" },
  { id: "yellow", label: "Geel", className: "text-amber-200" },
] as const;

type ColorId = (typeof COLORS)[number]["id"];

export function StroopGame({ userId, brainState, persistState, completeActivity }: Props) {
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [score, setScore] = useState(0);
  const [prompt, setPrompt] = useState<{ word: ColorId; ink: ColorId } | null>(null);
  const timerRef = useRef<number | null>(null);

  const rand = useMemo(() => seededRng(`${userId}:${brainState.dailyKey || getTodayKey()}:stroop`), [brainState.dailyKey, userId]);

  const nextPrompt = useCallback(() => {
    const word = COLORS[Math.floor(rand() * COLORS.length)]!.id;
    const ink = COLORS[Math.floor(rand() * COLORS.length)]!.id;
    setPrompt({ word, ink });
  }, [rand]);

  const stop = useCallback(async () => {
    setRunning(false);
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const next = updateStroopScore(brainState, score);
    persistState(next);
    if (!brainState.stroopDone) {
      await completeActivity("stroop");
      neuroToast.success("Stroop voltooid.");
    }
  }, [brainState, completeActivity, persistState, score]);

  const start = useCallback(() => {
    if (brainState.stroopDone) return;
    setScore(0);
    setSecondsLeft(30);
    setRunning(true);
    nextPrompt();
    if (timerRef.current != null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          void stop();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [brainState.stroopDone, nextPrompt, stop]);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearInterval(timerRef.current);
    };
  }, []);

  const onAnswer = useCallback(
    (answer: ColorId) => {
      if (!running || !prompt) return;
      const correct = answer === prompt.ink;
      setScore((prev) => Math.max(0, prev + (correct ? 1 : -1)));
      nextPrompt();
    },
    [nextPrompt, prompt, running]
  );

  const inkClass = useMemo(() => {
    const ink = prompt?.ink;
    return COLORS.find((c) => c.id === ink)?.className ?? "text-[var(--text-primary)]";
  }, [prompt?.ink]);

  return (
    <section className="card-simple space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Stroop</h3>
        <span className={`text-xs font-semibold ${brainState.stroopDone ? "text-emerald-300" : "text-[var(--text-muted)]"}`}>
          {brainState.stroopDone ? "Voltooid (+25 XP)" : "Niet voltooid"}
        </span>
      </div>

      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-3">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <p>Tijd: <span className="font-semibold text-[var(--text-primary)]">{secondsLeft}s</span></p>
          <p>Score: <span className="font-semibold text-[var(--text-primary)]">{score}</span></p>
        </div>
        <div className="mt-3 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Kies de inktkleur</p>
          <p className={`mt-2 text-3xl font-extrabold ${inkClass}`}>{prompt ? COLORS.find((c) => c.id === prompt.word)?.label : "—"}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={!running || brainState.stroopDone}
              onClick={() => onAnswer(c.id)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
        <button
          type="button"
          onClick={start}
          disabled={brainState.stroopDone}
          className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
        >
          {brainState.stroopDone ? "Klaar" : running ? "Bezig..." : "Start Stroop"}
        </button>
        <p>Beste: <span className="font-semibold text-[var(--text-primary)]">{brainState.stroopBestScore ?? "—"}</span></p>
      </div>
    </section>
  );
}

