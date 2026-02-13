"use client";

import { useState } from "react";

export function ClarityExplain() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-neuro-muted hover:text-neuro-silver hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] focus-visible:ring-offset-1 rounded"
        aria-expanded={open}
        aria-controls="clarity-formula"
        id="clarity-toggle"
      >
        {open ? "Hide formula" : "How clarity works"}
      </button>
      <div id="clarity-formula" aria-labelledby="clarity-toggle" role="region">
        {open && (
          <div className="mt-2 rounded-lg border border-[var(--accent-neutral)]/50 bg-[var(--bg-primary)]/60 p-3 space-y-2">
            <p className="text-xs font-medium text-[var(--text-secondary)]">Clarity = Interest + Future value − Effort</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-[var(--text-muted)]">
              <li><strong className="text-[var(--text-secondary)]">Interest</strong> (1–10): How much do you want to do this?</li>
              <li><strong className="text-[var(--text-secondary)]">Future value</strong> (1–10): How much will it matter long-term?</li>
              <li><strong className="text-[var(--text-secondary)]">Effort</strong> (1–10): How hard is it? Higher = harder.</li>
            </ol>
            <p className="text-xs text-[var(--text-muted)]">Higher clarity = better fit. Use it to compare options without emotional bias.</p>
          </div>
        )}
      </div>
    </div>
  );
}
