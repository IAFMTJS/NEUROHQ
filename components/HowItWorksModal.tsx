"use client";

import { useEffect } from "react";

const sections = [
  { title: "Brain status", text: "Energy, focus, and load drive your daily capacity. Update daily; \"Same as yesterday\" pre-fills when available." },
  { title: "Energy budget", text: "Three pools (Energy, Focus, Load) split task and calendar cost. Capacity comes from brain status. Tasks use ~5 energy, ~3.5 focus, ~1.5 load on average." },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden onClick={onClose} />
      <div
        className="relative card-modern max-w-sm max-h-[85vh] overflow-y-auto p-5 shadow-xl"
        role="dialog"
        aria-labelledby="how-title"
        aria-modal
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="how-title" className="text-lg font-semibold text-neuro-silver">How it works</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neuro-muted hover:bg-neuro-surface hover:text-neuro-silver"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="space-y-4 text-sm text-neuro-muted">
          {sections.map((s, i) => (
            <div key={i}>
              <strong className="text-neuro-silver">{s.title}</strong>
              <span> — {s.text}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-hq-primary mt-4 w-full rounded-lg py-2.5"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
