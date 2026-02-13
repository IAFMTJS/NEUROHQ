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
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-neuro-silver">Quote of the day</h2>
          <p className="mt-0.5 text-xs text-neuro-muted">Day {day} of 365</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView("prev")}
            disabled={view === "prev"}
            className="rounded-lg p-2 text-neuro-muted hover:bg-neuro-surface hover:text-neuro-silver disabled:opacity-40 disabled:hover:bg-transparent transition"
            aria-label="Previous quote"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setView("next")}
            disabled={view === "next"}
            className="rounded-lg p-2 text-neuro-muted hover:bg-neuro-surface hover:text-neuro-silver disabled:opacity-40 disabled:hover:bg-transparent transition"
            aria-label="Next quote"
          >
            ›
          </button>
        </div>
      </div>
      <div className="p-5">
        {!active.quote ? (
          <p className="text-sm text-neuro-muted">No quote for day {day}.</p>
        ) : (
          <>
            <p className="text-[1.05rem] leading-relaxed text-neuro-silver">&ldquo;{active.quote.quote_text}&rdquo;</p>
            <p className="mt-3 text-sm text-neuro-muted">
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
