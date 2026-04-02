"use client";

import { createPortal } from "react-dom";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "HQ",
  "/tasks": "Missions",
  "/budget": "Budget",
  "/learning": "Growth",
  "/profile": "XP",
  "/strategy": "Strategy",
  "/report": "Insights",
  "/settings": "Settings",
};

type Props = {
  open: boolean;
  route: string;
  onNext: () => void;
};

export function TransitionOverlay({ open, route, onNext }: Props) {
  if (!open) return null;
  const label = ROUTE_LABELS[route] ?? route.replace(/^\//, "");

  const content = (
    <div
      className="fixed inset-0 z-[99] flex items-center justify-center p-4"
      style={{ minHeight: "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-label="Navigate to next step"
    >
      <div
        className="absolute inset-0 bg-black/60"
        style={{ backgroundColor: "var(--modal-backdrop, rgba(0,0,0,0.6))" }}
        aria-hidden
      />
      <div className="modal-card relative z-[101] w-full max-w-[min(360px,94vw)] rounded-xl border border-[var(--card-border)] bg-[var(--modal-bg)] p-6 shadow-[var(--hud-elevation-modal)]">
        <p className="text-base font-medium text-[var(--text-primary)]">
          Let&apos;s go to the {label} page.
        </p>
        <button
          type="button"
          onClick={onNext}
          className="btn-primary mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold"
        >
          Next
        </button>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : content;
}
