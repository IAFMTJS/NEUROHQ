"use client";

/**
 * Commander HQ UI Kit – Modal (backdrop + glass panel).
 * Uses .hq-glass for panel.
 */
export type HQModalProps = {
  children: React.ReactNode;
  /** When false, renders nothing. When true, shows modal. */
  open?: boolean;
  onClose?: () => void;
  /** Panel width – default 500px */
  width?: number | string;
  className?: string;
};

export function HQModal({
  children,
  open = true,
  onClose,
  width = 500,
  className = "",
}: HQModalProps) {
  if (!open) return null;

  const w = typeof width === "number" ? `${width}px` : width;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose ? (e) => e.target === e.currentTarget && onClose() : undefined}
    >
      <div className="modal-backdrop absolute inset-0" aria-hidden onClick={onClose} />
      <div
        className={`glass-panel p-8 relative ${className}`}
        style={{ width: w, maxWidth: "calc(100vw - 2rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-[18px] border border-[var(--glass-border-soft)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 hover:text-[var(--text-primary)] hover:shadow-[0_0_12px_rgba(0,229,255,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]"
            aria-label="Close"
          >
            <span className="text-xl leading-none" aria-hidden>×</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
