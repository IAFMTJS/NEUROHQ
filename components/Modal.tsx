"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export type ModalSize = "sm" | "md" | "lg";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional subtitle under the title */
  subtitle?: string;
  children: React.ReactNode;
  /** Optional footer (e.g. Cancel + Confirm buttons) – rendered in a fixed bar at bottom */
  footer?: React.ReactNode;
  /** Optional: show small NEUROHQ logo in header */
  showBranding?: boolean;
  /** No padding on body (e.g. custom layout) */
  noPadding?: boolean;
  /** Max width: sm 320px, md 400px, lg 480px */
  size?: ModalSize;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-[320px]",
  md: "max-w-[400px]",
  lg: "max-w-[480px]",
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showBranding = false,
  noPadding = false,
  size = "md",
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousActive.current = document.activeElement as HTMLElement | null;
    const focusable = overlayRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
    return () => {
      previousActive.current?.focus?.();
    };
  }, [open]);

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

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={subtitle ? "modal-subtitle" : undefined}
    >
      <div
        className="modal-backdrop absolute inset-0"
        aria-hidden
        onClick={onClose}
      />
      <div
        className={`modal-card relative w-full ${sizeClasses[size]} ${size === "lg" ? "max-h-[90vh]" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: logo (optional) + title + close */}
        <header className="modal-card-header">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {showBranding && (
              <Image
                src="/app-icon.png"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-xl object-contain"
              />
            )}
            <div className="min-w-0 flex-1">
              <h2
                id="modal-title"
                className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
              >
                {title}
              </h2>
              {subtitle && (
                <p
                  id="modal-subtitle"
                  className="mt-0.5 text-sm text-[var(--text-muted)]"
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-[var(--border-subtle)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 hover:text-[var(--text-primary)] hover:shadow-[0_0_12px_rgba(0,229,255,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]"
            aria-label="Close"
          >
            <span className="text-xl leading-none" aria-hidden>×</span>
          </button>
        </header>

        {/* Body */}
        <div
          className={`modal-card-body ${noPadding ? "p-0" : ""}`}
        >
          {children}
        </div>

        {/* Footer (optional) */}
        {footer != null && (
          <footer className="modal-card-footer">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
