"use client";

import { useState } from "react";

export function ClarityExplain() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-neuro-muted hover:text-neuro-silver hover:underline"
      >
        {open ? "Hide formula" : "Clarity = Interest + Future value − Effort"}
      </button>
      {open && (
        <p className="mt-1 text-xs text-neuro-muted leading-relaxed">
          Rate each path 1–10 for interest and future value, and 1–10 for effort (higher = harder). Clarity = I + F − E. Higher scores suggest a better fit without emotional bias.
        </p>
      )}
    </div>
  );
}
