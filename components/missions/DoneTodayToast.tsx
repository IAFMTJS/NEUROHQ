"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Task } from "@/types/database.types";

type TaskRow = Task & { category?: string | null };

type Props = {
  open: boolean;
  onClose: () => void;
  tasks: TaskRow[];
  onUncomplete: (id: string) => void;
  pending: boolean;
};

/**
 * Toast-styled floating panel (portal) for today’s completed missions.
 * Stays in the parent React tree via portal children so the list updates when uncompleting.
 */
export function DoneTodayToast({ open, onClose, tasks, onUncomplete, pending }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open && tasks.length === 0) onClose();
  }, [open, tasks.length, onClose]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("button[data-done-today-close]")?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;
    const el = previousFocus.current;
    previousFocus.current = null;
    if (el?.focus) {
      try {
        el.focus();
      } catch {
        /* ignore */
      }
    }
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-3 sm:items-end sm:justify-end sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Sluit voltooide missies"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="done-today-toast"
        role="dialog"
        aria-modal="true"
        aria-labelledby="done-today-toast-title"
        className="relative z-10 flex max-h-[min(70vh,22rem)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)] shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--card-border)] px-4 py-3">
          <h2 id="done-today-toast-title" className="text-sm font-semibold text-[var(--text-primary)]">
            Voltooid vandaag
          </h2>
          <button
            type="button"
            data-done-today-close
            onClick={onClose}
            className="rounded-lg border border-[var(--card-border)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            Sluiten
          </button>
        </div>
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3 [-webkit-overflow-scrolling:touch]">
          {tasks.map((t) => (
            <li key={t.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/35 px-3 py-2.5 transition hover:bg-[var(--bg-primary)]/55">
                <input
                  type="checkbox"
                  checked
                  disabled={pending}
                  onChange={(e) => {
                    if (!e.target.checked) onUncomplete(t.id);
                  }}
                  className="h-4 w-4 shrink-0 rounded border-[var(--card-border)] accent-[var(--accent-focus)] disabled:opacity-50"
                  aria-label={`${(t.title ?? "Missie").replace(/"/g, "'")} is voltooid. Vink uit om ongedaan te maken.`}
                />
                <span className="min-w-0 flex-1 text-sm leading-snug text-[var(--text-secondary)] line-through">
                  {t.title ?? "Missie"}
                </span>
                {t.category ? (
                  <span className="shrink-0 rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                    {t.category}
                  </span>
                ) : null}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
}
