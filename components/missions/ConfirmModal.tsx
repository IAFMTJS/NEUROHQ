"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Modal } from "@/components/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  /** Slide up from bottom (mobile-friendly) with blur and focus trap; use for delete. */
  slideFromBottom?: boolean;
};

function getFocusables(container: HTMLElement): HTMLElement[] {
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent != null
  );
}

export function ConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  slideFromBottom = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousActive = useRef<HTMLElement | null>(null);

  async function handleConfirm() {
    if (danger && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  // Focus trap and restore
  useEffect(() => {
    if (!open || !overlayRef.current) return;
    previousActive.current = document.activeElement as HTMLElement | null;
    const focusables = getFocusables(overlayRef.current);
    focusables[0]?.focus();
    return () => {
      previousActive.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !overlayRef.current) return;
      const focusables = getFocusables(overlayRef.current);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const target = e.target as HTMLElement;
      if (e.shiftKey) {
        if (target === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (target === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-[var(--card-border)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-neutral)]"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 ${
          danger
            ? "bg-red-500 hover:bg-red-600 active:scale-[0.98]"
            : "bg-[var(--accent-focus)] hover:opacity-90"
        }`}
      >
        {loading ? "…" : confirmLabel}
      </button>
    </>
  );

  if (slideFromBottom && typeof document !== "undefined") {
    const sheetContent = (
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] flex flex-col justify-end modal-overlay modal-overlay-blur"
        style={{ minHeight: "100dvh" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div
          className="modal-backdrop-blur absolute inset-0"
          aria-hidden
          onClick={onClose}
        />
        <div
          className="modal-card modal-card-interactive relative flex w-full max-w-[min(440px,94vw)] mx-auto max-h-[85dvh] flex-col rounded-t-[22px] rounded-b-none border-b-0 animate-slide-up-sheet"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-center pt-3 pb-1" aria-hidden>
            <span className="h-1 w-12 rounded-full bg-white/25" />
          </div>
          <header className="modal-card-header shrink-0 flex items-start justify-between gap-3 px-4 pb-2">
            <h2
              id="confirm-modal-title"
              className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-[var(--glass-border-soft)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]"
              aria-label="Close"
            >
              <span className="text-xl leading-none" aria-hidden>×</span>
            </button>
          </header>
          <div className="modal-card-body flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-2">
            <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
              {message}
            </p>
          </div>
          <footer className="modal-card-footer shrink-0 flex items-center justify-end gap-3 px-4 pb-6">
            {footer}
          </footer>
        </div>
      </div>
    );
    return createPortal(sheetContent, document.body);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
        {message}
      </p>
    </Modal>
  );
}
