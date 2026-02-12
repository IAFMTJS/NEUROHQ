"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Optional: show NEUROHQ branding in modal header */
  showBranding?: boolean;
  /** Optional: no padding on body (e.g. for custom layout) */
  noPadding?: boolean;
};

export function Modal({ open, onClose, title, children, showBranding = true, noPadding }: Props) {
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden
        onClick={onClose}
      />
      {/* Card */}
      <div
        className="modal-card relative w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {showBranding && (
          <div className="flex items-center justify-center gap-2 border-b border-neuro-border px-4 py-2.5">
            <Image src="/app-icon.png" alt="" width={24} height={24} className="h-6 w-6 rounded object-contain" />
            <span className="text-xs font-medium text-neuro-muted">NEUROHQ</span>
          </div>
        )}
        <div className={noPadding ? undefined : "p-5"}>
          <h2 id="modal-title" className="text-lg font-semibold text-neuro-silver">
            {title}
          </h2>
          <div className={noPadding ? undefined : "mt-3"}>{children}</div>
        </div>
      </div>
    </div>
  );
}
