"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { updateSequenceLevel, type BrainTrainingState } from "@/lib/brain-training/store";
import { seededRng } from "@/components/brain/games/_shared";

type Props = {
  userId: string;
  brainState: BrainTrainingState;
  persistState: (next: BrainTrainingState) => void;
  completeActivity: (activity: "sequence_recall") => Promise<void>;
};

function makeDigits(rand: () => number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += String(Math.floor(rand() * 10));
  }
  return out;
}

export function SequenceRecallGame({ userId, brainState, persistState, completeActivity }: Props) {
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "done">("idle");
  const [sequence, setSequence] = useState<string>("");
  const [answer, setAnswer] = useState("");
  const hideTimeoutRef = useRef<number | null>(null);

  const rand = useMemo(() => seededRng(`${userId}:${brainState.dailyKey}:sequence`), [brainState.dailyKey, userId]);

  const showNext = useCallback(() => {
    const seq = makeDigits(rand, Math.min(10, Math.max(1, level + 2)));
    setSequence(seq);
    setAnswer("");
    setPhase("show");
    if (hideTimeoutRef.current != null) window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => {
      setPhase("input");
      hideTimeoutRef.current = null;
    }, 700 + seq.length * 220);
  }, [level, rand]);

  const start = useCallback(() => {
    if (brainState.sequenceRecallDone) return;
    setLevel(1);
    setPhase("idle");
    showNext();
  }, [brainState.sequenceRecallDone, showNext]);

  const finish = useCallback(
    async (finalLevel: number) => {
      setPhase("done");
      const next = updateSequenceLevel(brainState, finalLevel);
      persistState(next);
      if (!brainState.sequenceRecallDone) {
        await completeActivity("sequence_recall");
        neuroToast.success("Sequence Recall voltooid.");
      }
    },
    [brainState, completeActivity, persistState]
  );

  const submit = useCallback(async () => {
    if (phase !== "input") return;
    if (answer === sequence) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      showNext();
      return;
    }
    await finish(level);
  }, [answer, finish, level, phase, sequence, showNext]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current != null) window.clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <section className="card-simple space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sequence Recall</h3>
        <span className={`text-xs font-semibold ${brainState.sequenceRecallDone ? "text-emerald-300" : "text-[var(--text-muted)]"}`}>
          {brainState.sequenceRecallDone ? "Voltooid (+25 XP)" : "Niet voltooid"}
        </span>
      </div>

      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-3">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <p>Level: <span className="font-semibold text-[var(--text-primary)]">{level}</span></p>
          <p>Beste: <span className="font-semibold text-[var(--text-primary)]">{brainState.sequenceBestLevel ?? "—"}</span></p>
        </div>

        <div className="mt-3 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4 text-center">
          {phase === "show" && <p className="text-3xl font-extrabold tracking-[0.22em] text-[var(--text-primary)]">{sequence}</p>}
          {phase !== "show" && <p className="text-3xl font-extrabold tracking-[0.22em] text-[var(--text-muted)]">••••</p>}
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            {phase === "show" ? "Onthoud de reeks" : phase === "input" ? "Typ de reeks" : "—"}
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/\\D/g, "").slice(0, 12))}
            disabled={phase !== "input" || brainState.sequenceRecallDone}
            inputMode="numeric"
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/60 disabled:opacity-50"
            placeholder="0123..."
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={phase !== "input" || brainState.sequenceRecallDone}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
          >
            OK
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
        <button
          type="button"
          onClick={start}
          disabled={brainState.sequenceRecallDone}
          className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
        >
          Start sequence
        </button>
      </div>
    </section>
  );
}

