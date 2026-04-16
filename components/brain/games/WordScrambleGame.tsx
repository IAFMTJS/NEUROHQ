"use client";

import { useCallback, useMemo, useState } from "react";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { shuffle, seededRng } from "@/components/brain/games/_shared";
import { updateWordStreak, type BrainTrainingState } from "@/lib/brain-training/store";

type Props = {
  userId: string;
  brainState: BrainTrainingState;
  persistState: (next: BrainTrainingState) => void;
  completeActivity: (activity: "word_scramble") => Promise<void>;
};

const WORDS = [
  "brein",
  "focus",
  "routine",
  "energie",
  "taak",
  "actie",
  "plan",
  "doel",
  "mood",
  "slaap",
  "streak",
  "progress",
  "neuro",
  "flow",
  "leren",
  "bouwen",
] as const;

function scramble(word: string, rand: () => number): string {
  const chars = word.split("");
  const mixed = shuffle(chars, rand).join("");
  if (mixed === word && word.length > 1) {
    const swapped = [...chars];
    [swapped[0], swapped[1]] = [swapped[1]!, swapped[0]!];
    return swapped.join("");
  }
  return mixed;
}

export function WordScrambleGame({ userId, brainState, persistState, completeActivity }: Props) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const rand = useMemo(() => seededRng(`${userId}:${brainState.dailyKey}:word_scramble`), [brainState.dailyKey, userId]);
  const dailyWords = useMemo(() => {
    const picks = shuffle([...WORDS], rand).slice(0, 8);
    return picks;
  }, [rand]);

  const currentWord = dailyWords[index] ?? null;
  const scrambled = useMemo(() => (currentWord ? scramble(currentWord, rand) : null), [currentWord, rand]);

  const submit = useCallback(async () => {
    if (!currentWord) return;
    const guess = input.trim().toLowerCase();
    if (!guess) return;
    if (guess === currentWord) {
      const nextStreak = streak + 1;
      const nextBest = Math.max(bestStreak, nextStreak);
      setStreak(nextStreak);
      setBestStreak(nextBest);
      setInput("");
      const nextIndex = index + 1;
      if (nextIndex >= dailyWords.length) {
        const next = updateWordStreak(brainState, nextBest);
        persistState(next);
        if (!brainState.wordScrambleDone) {
          await completeActivity("word_scramble");
          neuroToast.success("Word Scramble voltooid.");
        }
        return;
      }
      setIndex(nextIndex);
      return;
    }
    setStreak(0);
    neuroToast.info("Niet correct. Probeer de volgende.");
    setInput("");
    setIndex((prev) => Math.min(dailyWords.length - 1, prev + 1));
  }, [bestStreak, brainState, completeActivity, currentWord, dailyWords.length, index, input, persistState, streak]);

  const reset = useCallback(() => {
    setIndex(0);
    setInput("");
    setStreak(0);
    setBestStreak(0);
  }, []);

  return (
    <section className="card-simple space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Word Scramble</h3>
        <span className={`text-xs font-semibold ${brainState.wordScrambleDone ? "text-emerald-300" : "text-[var(--text-muted)]"}`}>
          {brainState.wordScrambleDone ? "Voltooid (+25 XP)" : "Niet voltooid"}
        </span>
      </div>

      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-3">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <p>Woord: <span className="font-semibold text-[var(--text-primary)]">{Math.min(index + 1, dailyWords.length)}/{dailyWords.length}</span></p>
          <p>Streak: <span className="font-semibold text-[var(--text-primary)]">{streak}</span></p>
        </div>

        <div className="mt-3 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Unscramble</p>
          <p className="mt-2 text-3xl font-extrabold tracking-[0.22em] text-[var(--accent-focus)]">{scrambled ?? "—"}</p>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={brainState.wordScrambleDone}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/60 disabled:opacity-50"
            placeholder="Jouw antwoord..."
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={brainState.wordScrambleDone}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
          >
            OK
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        >
          Reset
        </button>
        <p>Beste: <span className="font-semibold text-[var(--text-primary)]">{brainState.wordBestStreak ?? bestStreak ?? "—"}</span></p>
      </div>
    </section>
  );
}

