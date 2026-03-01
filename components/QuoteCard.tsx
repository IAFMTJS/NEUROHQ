"use client";

import { useState } from "react";
import type { Quote } from "@/types/database.types";

type QuoteWithDay = { quote: Quote | null; day: number };

type Props = {
  prev: QuoteWithDay;
  current: QuoteWithDay;
  next: QuoteWithDay;
};

/** Quote of the day with prev/next browse. */
export function QuoteCard({ prev, current, next }: Props) {
  const [view, setView] = useState<"prev" | "current" | "next">("current");
  const active = view === "prev" ? prev : view === "next" ? next : current;
  const day = active.day;

  return (
    <div className="glass-card glass-card-glow-blue overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-400/90 text-lg drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" aria-hidden>★</span>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Quote of the day</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Day {day} of 365</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView("prev")}
            disabled={view === "prev"}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:hover:bg-transparent transition"
            aria-label="Previous quote"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setView("next")}
            disabled={view === "next"}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:hover:bg-transparent transition"
            aria-label="Next quote"
          >
            ›
          </button>
        </div>
      </div>
      <div className="p-5">
        {!active.quote ? (
          <p className="text-sm text-[var(--text-muted)]">No quote for day {day}.</p>
        ) : (
          <>
            <p className="text-[1.05rem] leading-relaxed text-[var(--text-primary)] italic" style={{ textShadow: "0 0 12px rgba(255,255,255,0.06)" }}>&ldquo;{active.quote.quote_text}&rdquo;</p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              — {active.quote.author_name}
              {active.quote.era && ` · ${active.quote.era}`}
              {active.quote.topic && ` · On ${active.quote.topic}`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
