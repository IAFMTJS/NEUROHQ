"use client";

import { useTransition } from "react";
import { dismissAlternative } from "@/app/actions/alternatives";
import type { Alternative } from "@/app/actions/alternatives";

export function AlternativesList({ alternatives }: { alternatives: Alternative[] }) {
  const [pending, startTransition] = useTransition();
  if (alternatives.length === 0) return null;
  return (
    <ul className="space-y-2">
      {alternatives.map((a) => (
        <li
          key={a.id}
          className="flex items-center justify-between rounded border border-neutral-700 bg-neuro-surface px-3 py-2 text-sm text-neuro-silver"
        >
          <span>{a.suggestion_text}</span>
          <button
            type="button"
            onClick={() => startTransition(() => dismissAlternative(a.id))}
            disabled={pending}
            className="text-xs text-neutral-500 hover:text-neuro-silver focus:outline-none focus:underline"
            aria-label="Dismiss suggestion"
          >
            Dismiss
          </button>
        </li>
      ))}
    </ul>
  );
}
