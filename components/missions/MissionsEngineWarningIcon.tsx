"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  lines: string[];
  className?: string;
};

export function MissionsEngineWarningIcon({ lines, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (lines.length === 0) return null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label="Engine-meldingen"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/15 bg-amber-500/[0.06] text-amber-400/70 opacity-70 transition hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
          <path
            d="M12 2L2 20h20L12 2z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M12 9v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.25" fill="currentColor" />
        </svg>
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Meldingen"
          className="absolute right-0 top-full z-30 mt-1.5 w-[min(calc(100vw-2rem),18rem)] rounded-lg border border-amber-500/25 bg-[var(--bg-surface)]/96 px-3 py-2.5 text-left text-xs leading-relaxed text-[var(--text-secondary)] shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-sm"
        >
          <ul className="list-inside list-disc space-y-1.5 marker:text-amber-500/60">
            {lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
