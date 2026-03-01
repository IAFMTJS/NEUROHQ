"use client";

import { useEffect, useState } from "react";
import type { AppMode } from "@/app/actions/mode";
import { HudButton } from "@/components/hud-test/HudButton";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay">
      <div className="modal-backdrop absolute inset-0" aria-hidden onClick={handleDismiss} />
      <div
        className="modal-card dashboard-hud-sheet dashboard-hud-modal relative w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="mode-modal-title"
        aria-describedby="mode-modal-desc"
      >
        <header className="modal-card-header">
          <h2 id="mode-modal-title" className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleDismiss}
            className="dashboard-hud-nav-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-neutral)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <span className="text-xl leading-none">x</span>
          </button>
        </header>
        <div className="modal-card-body">
          <p id="mode-modal-desc" className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
            {body}
          </p>
        </div>
        <footer className="modal-card-footer">
          <HudButton
            onClick={handleDismiss}
            className="h-[46px] w-full rounded-[14px] px-5 text-[12px] tracking-[0.08em]"
          >
            Got it
          </HudButton>
        </footer>
      </div>
    </div>
  );
}
