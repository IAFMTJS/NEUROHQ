"use client";

import { useState, useRef, useEffect } from "react";
import { useOnboarding } from "./OnboardingProvider";

type Props = {
  tipId: string;
  message: string;
  /** Optional: position relative to this anchor. Default is below. */
  position?: "below" | "above" | "left" | "right";
  children?: React.ReactNode;
  /** If provided, the tip is shown near this element (wrapper). Otherwise as a small floating pill. */
  className?: string;
};

/**
 * First-visit contextual tip. Shows once per device per tipId.
 * Dismissing marks the tip as seen in localStorage.
 */
export function ContextualTip({
  tipId,
  message,
  position = "below",
  children,
  className = "",
}: Props) {
  const onboarding = useOnboarding();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const seen = onboarding?.isTipSeen(tipId) ?? true;
  const shouldShow = !seen && !dismissed;

  useEffect(() => {
    if (!onboarding || onboarding.isTipSeen(tipId)) return;
    setVisible(true);
  }, [onboarding, tipId]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    onboarding?.markTipSeen(tipId);
  };

  if (!visible || !shouldShow) {
    return <>{children}</>;
  }

  const positionClasses = {
    below: "top-full left-1/2 -translate-x-1/2 mt-2",
    above: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const tipEl = (
    <div
      className={`z-[90] w-max max-w-[260px] rounded-xl border border-[var(--card-border)] bg-[var(--modal-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] shadow-[var(--hud-elevation-card)] ${children ? `absolute ${positionClasses[position]}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <p className="text-[var(--text-muted)]">{message}</p>
      <button
        type="button"
        onClick={handleDismiss}
        className="mt-2 text-xs font-medium text-[var(--accent-focus)] hover:underline"
      >
        Got it
      </button>
    </div>
  );

  if (!children) {
    return (
      <div className={`mb-2 ${className}`} ref={wrapperRef}>
        {tipEl}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={wrapperRef}>
      {children}
      {tipEl}
    </div>
  );
}
