"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getMoodInterventionCandidate,
  recordMoodToastShown,
  recordLateNightMoodConfirm,
  saveDailyMoodLabel,
  addMoodInterventionTask,
  type MoodInterventionCandidate,
} from "@/app/actions/mood-intervention";
import { MOOD_QUICK_ACTIONS } from "@/lib/mood-intervention-config";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { playUiSound } from "@/lib/audio/ui-sounds";

const STORAGE_KEY = "neurohq-mood-auto-toast";

function MoodToastContent({
  candidate,
  toastId,
}: {
  candidate: MoodInterventionCandidate;
  toastId: string | number;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  async function onYes() {
    await saveDailyMoodLabel(candidate.mood);
    if (candidate.triggerId === "late_night_active") {
      void recordLateNightMoodConfirm();
    }
    setStep(2);
  }

  function onNo() {
    toast.dismiss(toastId);
  }

  const actions = MOOD_QUICK_ACTIONS[candidate.mood];

  if (step === 2) {
    return (
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200/90">Kies één</p>
        <div className="flex flex-col gap-2">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              className="rounded-xl border border-violet-400/25 bg-violet-950/40 px-3 py-2.5 text-left text-sm font-semibold text-[var(--text-primary)] transition hover:border-violet-400/45 hover:bg-violet-900/35"
              onClick={async () => {
                const r = await addMoodInterventionTask(a.taskTitle, candidate.mood);
                if (r.ok) {
                  neuroToast.success("Taak toegevoegd voor vandaag.");
                  toast.dismiss(toastId);
                } else {
                  neuroToast.error(r.error ?? "Kon taak niet toevoegen.");
                }
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="w-full rounded-lg py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          onClick={() => toast.dismiss(toastId)}
        >
          Sluiten
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/85">Mood check</p>
      <p className="text-base font-bold leading-snug text-[var(--text-primary)]">{candidate.title}</p>
      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{candidate.body}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          className="rounded-xl bg-violet-500/90 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition hover:bg-violet-400"
          onClick={() => void onYes()}
        >
          Ja
        </button>
        <button
          type="button"
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-white/10"
          onClick={onNo}
        >
          Nee
        </button>
      </div>
    </div>
  );
}

export function MoodInterventionHost() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const today = new Date().toISOString().slice(0, 10);
    const storageKey = `${STORAGE_KEY}-${today}`;

    const t = window.setTimeout(() => {
      void (async () => {
        try {
          if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey)) return;

          const candidate = await getMoodInterventionCandidate();
          if (!candidate) return;

          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(storageKey, "1");
          }

          void recordMoodToastShown(candidate.triggerId);

          playUiSound("nudge");

          toast.custom(
            (tid) => (
              <div
                className="mood-toast-shell relative w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-violet-500/30 bg-[linear-gradient(165deg,rgba(46,16,101,0.92),rgba(15,23,42,0.96))] px-4 py-4 text-left backdrop-blur-md"
                role="dialog"
                aria-label="Mood check"
              >
                <MoodToastContent candidate={candidate} toastId={tid} />
              </div>
            ),
            { duration: Infinity, position: "top-center" }
          );
        } catch {
          // ignore
        }
      })();
    }, 5200);

    return () => window.clearTimeout(t);
  }, []);

  return null;
}
