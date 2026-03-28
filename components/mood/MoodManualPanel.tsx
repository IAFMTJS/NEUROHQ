"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { saveDailyMoodLabel, addMoodInterventionTask } from "@/app/actions/mood-intervention";
import { MOOD_LABEL_META, MOOD_QUICK_ACTIONS, type MoodLabel } from "@/lib/mood-intervention-config";
import { neuroToast } from "@/lib/ui/neuro-toast";

const ORDER: MoodLabel[] = ["overwhelmed", "tired", "low", "sick", "physical", "good"];

type Props = {
  open: boolean;
  onClose: () => void;
  /** Na opslaan mood (zodat header kan updaten). */
  onMoodSaved?: (label: MoodLabel) => void;
  brainStatusHint?: boolean;
};

export function MoodManualPanel({ open, onClose, onMoodSaved, brainStatusHint }: Props) {
  const [picked, setPicked] = useState<MoodLabel | null>(null);
  const [step, setStep] = useState<"pick" | "actions">("pick");
  /** Mood used for quick actions (ref stays stable if parent re-render resets state). */
  const actionsMoodRef = useRef<MoodLabel | null>(null);
  const prevOpenRef = useRef(false);

  useLayoutEffect(() => {
    if (open && !prevOpenRef.current) {
      setPicked(null);
      setStep("pick");
      actionsMoodRef.current = null;
    }
    prevOpenRef.current = open;
  }, [open]);

  function reset() {
    setPicked(null);
    setStep("pick");
    actionsMoodRef.current = null;
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function selectMood(m: MoodLabel) {
    setPicked(m);
    const r = await saveDailyMoodLabel(m);
    if (!r.ok) {
      neuroToast.error(r.error ?? "Kon mood niet opslaan.");
      return;
    }
    if (m === "good") {
      onMoodSaved?.(m);
      neuroToast.success("Mood opgeslagen.");
      handleClose();
      return;
    }
    actionsMoodRef.current = m;
    setStep("actions");
    queueMicrotask(() => onMoodSaved?.(m));
  }

  async function addTask(title: string) {
    const r = await addMoodInterventionTask(title);
    if (r.ok) {
      neuroToast.success("Taak toegevoegd voor vandaag.");
      handleClose();
    } else {
      neuroToast.error(r.error ?? "Kon taak niet toevoegen.");
    }
  }

  const actionsMood = picked && picked !== "good" ? picked : actionsMoodRef.current;
  const actions =
    actionsMood && actionsMood !== "good" ? MOOD_QUICK_ACTIONS[actionsMood] : [];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Hoe zit je erin?"
      subtitle="Zelfde flow als een engine-check — 1 tik om iets kleins te plannen."
      size="md"
      noPadding
    >
      <div className="border-t border-[var(--card-border)] px-4 py-4">
        {brainStatusHint && (
          <p className="mb-4 text-xs leading-relaxed text-[var(--text-muted)]">
            Sluit aan bij je{" "}
            <Link href="/dashboard" className="font-semibold text-violet-300 underline-offset-2 hover:underline">
              Brain Status check-in
            </Link>{" "}
            op het dashboard voor energie/focus; dit is je mood-laag.
          </p>
        )}

        {step === "pick" && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ORDER.map((key) => {
              const meta = MOOD_LABEL_META[key];
              return (
                <button
                  key={key}
                  type="button"
                  className="flex flex-col items-start gap-1 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-3 text-left transition hover:border-violet-400/45 hover:bg-violet-900/30"
                  onClick={() => void selectMood(key)}
                >
                  <span className="text-xl" aria-hidden>
                    {meta.emoji}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{meta.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {step === "actions" && actionsMood && actionsMood !== "good" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">Snel iets voor jezelf</p>
            <div className="flex flex-col gap-2">
              {actions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm font-semibold text-[var(--text-primary)] hover:bg-white/10"
                  onClick={() => void addTask(a.taskTitle)}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              onClick={handleClose}
            >
              Sluiten
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
