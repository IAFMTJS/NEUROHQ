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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="modal-backdrop absolute inset-0"
        aria-hidden
        onClick={onClose}
      />
      {/* Card */}
      <div
        className="modal-card relative w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {showBranding && (
          <div className="flex items-center justify-center gap-3 border-b border-neuro-border/80 px-5 py-4">
            <Image src="/app-icon.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl object-contain shrink-0" />
            <span className="text-sm font-semibold tracking-tight text-neuro-silver">NEUROHQ</span>
          </div>
        )}
        <div className={noPadding ? undefined : "p-6"}>
          <h2 id="modal-title" className="text-xl font-semibold text-neuro-silver">
            {title}
          </h2>
          <div className={noPadding ? undefined : "mt-4"}>{children}</div>
        </div>
      </div>
    </div>
  );
}
