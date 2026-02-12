"use client";

import { useTransition } from "react";
import { deleteEducationOption } from "@/app/actions/learning";
import { clarityScore } from "@/lib/utils/learning";

type Option = {
  id: string;
  name: string;
  interest_score: number | null;
  future_value_score: number | null;
  effort_score: number | null;
};

export function EducationOptionsList({ options }: { options: Option[] }) {
  const [pending, startTransition] = useTransition();
  const withScore = options
    .map((o) => ({
      ...o,
      clarity: clarityScore(o.interest_score ?? 0, o.future_value_score ?? 0, o.effort_score ?? 0),
    }))
    .sort((a, b) => b.clarity - a.clarity);

  function handleDelete(id: string) {
    if (!confirm("Delete this option?")) return;
    startTransition(() => deleteEducationOption(id));
  }

  return (
    <ul className="space-y-2">
      {withScore.length === 0 ? (
        <li className="text-sm text-neutral-500">No education options yet.</li>
      ) : (
        withScore.map((o) => (
          <li key={o.id} className="flex items-center justify-between rounded border border-neutral-700 bg-neuro-surface px-3 py-2">
            <div>
              <span className="text-sm font-medium text-neuro-silver">{o.name}</span>
              <span className="ml-2 text-xs text-neutral-400">
                Clarity: {o.clarity} (I:{o.interest_score ?? "-"} F:{o.future_value_score ?? "-"} E:{o.effort_score ?? "-"})
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(o.id)}
              disabled={pending}
              className="text-xs text-neutral-500 hover:text-red-400"
            >
              Delete
            </button>
          </li>
        ))
      )}
    </ul>
  );
}
