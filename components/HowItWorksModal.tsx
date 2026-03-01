"use client";

import { useEffect } from "react";

const sections = [
  { title: "Brain status", text: "Energy, focus en mentale belasting bepalen je dagelijkse capaciteit. Update dagelijks; \"Zelfde als gisteren\" vult in wanneer beschikbaar." },
  { title: "Energy budget", text: "Drie pools (Energy, Focus, Mentale belasting) verdelen taak- en agendakosten. Capaciteit komt uit brain status. Taken gebruiken ~5 energy, ~3.5 focus, ~1.5 mentale belasting gemiddeld." },
  { title: "Missions", text: "Add tasks with optional energy level (1–10). Stabilize mode caps at 2 tasks; low-energy shows up to 3. Complete or reschedule to add more." },
  { title: "Modes", text: "Normal, Low energy, High sensory (minimal UI), Driven (impact-first), Stabilize (2 tasks max)." },
  { title: "Calendar", text: "Events count toward your energy budget. Social events cost 1.5×. Connect Google Calendar in Settings." },
  { title: "Carry-over", text: "Unfinished tasks move to today at midnight with an amber badge. Brain status resets per day." },
];

type Props = { open: boolean; onClose: () => void };

export function HowItWorksModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay">
      <div className="modal-backdrop absolute inset-0" aria-hidden onClick={onClose} />
      <div
        className="modal-card relative w-full max-w-md max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="how-title"
        aria-modal
      >
        <header className="modal-card-header">
          <h2 id="how-title" className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            How it works
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-neutral)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </header>
        <div className="modal-card-body space-y-5">
          {sections.map((s, i) => (
            <section key={i}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--accent-focus)]">
                {s.title}
              </h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                {s.text}
              </p>
            </section>
          ))}
        </div>
        <footer className="modal-card-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full rounded-xl py-3 text-base font-medium sm:w-auto sm:px-8"
          >
            Got it
          </button>
        </footer>
      </div>
    </div>
  );
}
