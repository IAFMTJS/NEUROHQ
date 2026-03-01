"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Optional subtitle under the title */
  subtitle?: string;
  /** Optional extra class on the sheet panel. */
  sheetClassName?: string;
};

/** Mobile-friendly bottom sheet: slides up from bottom, max 85dvh, backdrop. */
export function BottomSheet({ open, onClose, title, subtitle, children, sheetClassName }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sheetContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex flex-col justify-end modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
    >
      <div
        className="absolute inset-0 modal-backdrop"
        aria-hidden
        onClick={onClose}
      />
      <div
        className={`modal-card relative flex w-full max-h-[85dvh] flex-col rounded-t-[22px] rounded-b-none border-b-0 ${sheetClassName ?? ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-center pt-3 pb-1" aria-hidden>
          <span className="h-1 w-12 rounded-full bg-white/25" />
        </div>
        <header className="modal-card-header shrink-0 flex items-start justify-between gap-3 px-4 pb-2">
          <div className="min-w-0 flex-1">
            <h2
              id="sheet-title"
              className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-[var(--glass-border-soft)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]"
            aria-label="Sluiten"
          >
            <span className="text-xl leading-none" aria-hidden>×</span>
          </button>
        </header>
        <div className="modal-card-body flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-6">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(sheetContent, document.body)
    : sheetContent;
}
