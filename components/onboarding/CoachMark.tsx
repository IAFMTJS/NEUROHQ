"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function useFocusOnOpen(open: boolean) {
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) nextRef.current?.focus();
  }, [open]);
  return nextRef;
}

type Props = {
  open: boolean;
  title: string;
  body: string;
  stepIndex: number;
  totalSteps: number;
  targetSelector?: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  /** When true, Next is disabled until the user completes the required action. */
  nextDisabled?: boolean;
  /** Shown when nextDisabled is true (e.g. "Update your Brain Status above, then click Next."). */
  requiredActionHint?: string;
};

export function CoachMark({
  open,
  title,
  body,
  stepIndex,
  totalSteps,
  targetSelector,
  onBack,
  onNext,
  onSkip,
  nextDisabled = false,
  requiredActionHint,
}: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const nextRef = useFocusOnOpen(open);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const updateRect = () => {
      if (!targetSelector) {
        setRect(null);
        return;
      }
      const el = document.querySelector(targetSelector);
      if (!el || !(el instanceof HTMLElement)) {
        setRect(null);
        return;
      }
      setRect(el.getBoundingClientRect());
    };

    const run = () => {
      rafRef.current = requestAnimationFrame(() => {
        updateRect();
        rafRef.current = null;
      });
    };

    run();
    const resizeObs = new ResizeObserver(run);
    const el = targetSelector ? document.querySelector(targetSelector) : null;
    if (el) {
      resizeObs.observe(el);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    window.addEventListener("scroll", run, true);
    window.addEventListener("resize", run);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      resizeObs.disconnect();
      window.removeEventListener("scroll", run, true);
      window.removeEventListener("resize", run);
    };
  }, [open, targetSelector]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onSkip]);

  if (!open) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  /* When next is disabled (required action), allow clicks through to the page so the user can tap e.g. "Update check-in". */
  const allowClicksThrough = nextDisabled;

  const overlayContent = (
    <div
      className={`fixed inset-0 z-[99] flex flex-col items-center justify-end sm:justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] ${allowClicksThrough ? "pointer-events-none" : ""}`}
      style={{ minHeight: "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-mark-title"
      aria-describedby="coach-mark-body"
    >
      {/* Dimmed backdrop - when allowClicksThrough, overlay doesn't block so user can reach the target button */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{ backgroundColor: "var(--modal-backdrop, rgba(0,0,0,0.6))" }}
        aria-hidden
      />

      {/* Highlight cutout: we draw a glowing box around the target */}
      {rect && (
        <div
          className="pointer-events-none absolute z-[100] rounded-xl border-2 border-[var(--accent-focus)] transition-[top,left,width,height] duration-150"
          style={{
            top: rect.top,
            left: rect.left,
            width: Math.max(rect.width, 4),
            height: Math.max(rect.height, 4),
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5), 0 0 20px rgba(0, 195, 255, 0.4)",
          }}
        />
      )}

      {/* Explanation card - must receive pointer events when overlay allows clicks through */}
      <div
        className={`modal-card relative z-[101] w-full max-w-[min(400px,94vw)] rounded-xl border border-[var(--card-border)] bg-[var(--modal-bg)] p-4 shadow-[var(--hud-elevation-modal)] ${allowClicksThrough ? "pointer-events-auto" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="coach-mark-title" className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <p id="coach-mark-body" className="mt-2 text-sm text-[var(--text-muted)]">
          {body}
        </p>
        {targetSelector && rect == null && (
          <p className="mt-2 text-xs text-[var(--text-muted)] italic">
            Scroll the page to find this section if you don’t see a highlight.
          </p>
        )}
        {nextDisabled && requiredActionHint && (
          <p className="mt-2 rounded-lg border border-[var(--accent-focus)]/40 bg-[var(--accent-focus)]/10 px-3 py-2 text-xs text-[var(--accent-focus)]">
            {requiredActionHint}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={isFirst}
              className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
            >
              Back
            </button>
            <span className="text-xs text-[var(--text-muted)]" aria-live="polite">
              Step {stepIndex + 1} / {totalSteps}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              ref={!nextDisabled ? nextRef : undefined}
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="mt-3 w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-2"
          aria-label="Skip tutorial"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(overlayContent, document.body)
    : overlayContent;
}
