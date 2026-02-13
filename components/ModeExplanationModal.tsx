"use client";

import { useEffect, useState } from "react";
import type { AppMode } from "@/app/actions/mode";

const STORAGE_KEY = "neurohq-mode-explained";

const content: Record<"stabilize" | "low_energy", { title: string; body: string }> = {
  stabilize: {
    title: "Stabilize mode",
    body: "You have 2 tasks max today. Complete or reschedule them before adding more. This helps you focus and avoid overload.",
  },
  low_energy: {
    title: "Low energy mode",
    body: "We show up to 3 tasks and hide heavier ones. Adjust your brain status check-in to change your capacity.",
  },
};

type Props = { mode: AppMode };

export function ModeExplanationModal({ mode }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (mode !== "stabilize" && mode !== "low_energy") return;
    const key = `${STORAGE_KEY}-${mode}`;
    try {
      if (!localStorage.getItem(key)) setShow(true);
    } catch {
      setShow(true);
    }
  }, [mode]);

  function handleDismiss() {
    if (mode !== "stabilize" && mode !== "low_energy") return;
    try {
      localStorage.setItem(`${STORAGE_KEY}-${mode}`, "1");
    } catch {}
    setShow(false);
  }

  if (!show || (mode !== "stabilize" && mode !== "low_energy")) return null;

  const { title, body } = content[mode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden onClick={handleDismiss} />
      <div
        className="relative card-modern max-w-sm p-5 shadow-xl"
        role="dialog"
        aria-labelledby="mode-modal-title"
        aria-describedby="mode-modal-desc"
      >
        <h2 id="mode-modal-title" className="text-lg font-semibold text-neuro-silver">{title}</h2>
        <p id="mode-modal-desc" className="mt-2 text-sm text-neuro-muted">{body}</p>
        <button
          type="button"
          onClick={handleDismiss}
          className="btn-hq-primary mt-4 w-full rounded-lg py-2.5"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
