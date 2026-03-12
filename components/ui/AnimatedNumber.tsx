"use client";

import { useEffect, useState, useRef } from "react";

type Props = {
  value: number;
  /** Duration in ms for count-up. */
  durationMs?: number;
  /** Optional formatter (e.g. compact for 1.2k). */
  format?: (n: number) => string;
  /** Class for the span. */
  className?: string;
};

/**
 * Animates from previous value to current (count-up). Respects reduced-motion via data attribute.
 */
export function AnimatedNumber({ value, durationMs = 400, format = (n) => String(Math.round(n)), className }: Props) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reducedMotion =
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-reduced-motion") === "true";
    if (reducedMotion || value === prevRef.current) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }
    const start = prevRef.current;
    const delta = value - start;
    prevRef.current = value;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setDisplay(start + delta * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]);

  return <span className={className}>{format(display)}</span>;
}
