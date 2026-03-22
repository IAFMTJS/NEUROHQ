"use client";

import { useCallback, useState, useTransition } from "react";
import { logNeuroMicroReport, trackEvent } from "@/app/actions/analytics-events";

const WHY_CHIPS: { value: string; label: string }[] = [
  { value: "overwhelmed", label: "Overweldigd" },
  { value: "tired", label: "Moe" },
  { value: "boring", label: "Saai" },
  { value: "no_motivation", label: "Geen zin" },
];

const FOCUS_CHIPS: { value: string; label: string }[] = [
  { value: "phone", label: "Telefoon" },
  { value: "thoughts", label: "Gedachten" },
  { value: "environment", label: "Omgeving" },
];

type Props = {
  taskId: string;
  onClose: () => void;
};

export function NeuroMicroReportBar({ taskId, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const pick = useCallback(
    (kind: "why_stopped" | "focus_break", value: string) => {
      startTransition(async () => {
        try {
          await logNeuroMicroReport({ kind, value, taskId });
        } catch {
          /* ignore */
        }
        setSubmitted(true);
        window.setTimeout(onClose, 400);
      });
    },
    [taskId, onClose]
  );

  const dismiss = useCallback(() => {
    startTransition(async () => {
      try {
        await trackEvent("task_paralysis_dismiss", { surface: "micro_report_bar", taskId });
      } catch {
        /* ignore */
      }
      onClose();
    });
  }, [taskId, onClose]);

  if (submitted) {
    return (
      <div
        className="fixed bottom-4 left-4 right-4 z-[90] rounded-xl border border-[var(--semantic-accent)]/30 bg-[var(--bg-elevated)]/95 px-4 py-3 text-center text-xs text-[var(--text-muted)] shadow-lg md:left-auto md:right-4 md:max-w-md"
        role="status"
      >
        Bedankt — dit helpt ons patronen te herkennen.
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[90] rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/98 p-4 shadow-xl md:left-auto md:right-4 md:max-w-lg"
      role="dialog"
      aria-label="Korte reflectie"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--text-primary)]">Waarom nu niet? (optioneel)</p>
        <button
          type="button"
          onClick={dismiss}
          disabled={pending}
          className="shrink-0 rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
        >
          Sluiten
        </button>
      </div>
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">Geen diagnose — alleen om je flow te verbeteren.</p>
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Stop</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {WHY_CHIPS.map((c) => (
            <button
              key={c.value}
              type="button"
              disabled={pending}
              onClick={() => pick("why_stopped", c.value)}
              className="rounded-full border border-[var(--card-border)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)] hover:border-[var(--accent-focus)]/50 hover:text-[var(--text-primary)]"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Focus brak door</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {FOCUS_CHIPS.map((c) => (
            <button
              key={c.value}
              type="button"
              disabled={pending}
              onClick={() => pick("focus_break", c.value)}
              className="rounded-full border border-[var(--card-border)] bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)] hover:border-[var(--accent-focus)]/50 hover:text-[var(--text-primary)]"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
