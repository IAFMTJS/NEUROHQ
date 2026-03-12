"use client";

import { useEffect, useState, type ReactNode } from "react";

const DEFAULT_DELAY_MS = 250;

type Props = {
  /** Content to show after delay (e.g. skeleton). */
  children: ReactNode;
  /** Delay before showing. Fast loads never show the fallback. */
  delayMs?: number;
};

/**
 * Renders nothing for `delayMs`, then `children`. Use as loading fallback for dynamic()
 * so spinners only appear when the load actually takes a moment (psychological UX).
 */
export function DelayedFallback({ children, delayMs = DEFAULT_DELAY_MS }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  if (!show) return null;
  return <>{children}</>;
}
