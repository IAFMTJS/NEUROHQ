"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  deleteEducationOption,
  updateEducationOption,
  archiveEducationOption,
  unarchiveEducationOption,
} from "@/app/actions/learning";
import { clarityScore } from "@/lib/utils/learning";

type Option = {
  id: string;
  name: string;
  interest_score: number | null;
  future_value_score: number | null;
  effort_score: number | null;
  archived_at: string | null;
  category: string | null;
};

type Props = { options: Option[]; logSessionHref?: string };

export function EducationOptionsList({ options, logSessionHref = "/learning" }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const active = options.filter((o) => !o.archived_at);
  const archived = options.filter((o) => !!o.archived_at);

  const withScore = (list: Option[]) =>
    list
      .map((o) => ({
        ...o,
        clarity: clarityScore(o.interest_score ?? 0, o.future_value_score ?? 0, o.effort_score ?? 0),
      }))
      .sort((a, b) => b.clarity - a.clarity);

  const activeWithScore = withScore(active);
  const archivedWithScore = withScore(archived);

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {activeWithScore.length === 0 ? (
          <li className="text-sm text-neuro-muted">No education options yet. Add one above.</li>
        ) : (
          activeWithScore.map((o) => (
            <li key={o.id} className="rounded-xl border border-neuro-border bg-neuro-surface px-3 py-2">
                {editingId === o.id ? (
                  <EducationOptionEditForm
                    option={o}
                    onClose={() => setEditingId(null)}
                    onSave={() => setEditingId(null)}
                    pending={pending}
                  />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium text-neuro-silver">{o.name}</span>
                    {o.category && (
                      <span className="ml-2 text-xs text-neuro-muted">{o.category}</span>
                    )}
                    <span className="ml-2 text-xs text-neuro-muted">
                      Clarity: {o.clarity} (I:{o.interest_score ?? "-"} F:{o.future_value_score ?? "-"} E:{o.effort_score ?? "-"})
                    </span>
                  </div>
                  <span className="flex items-center gap-2">
                    {logSessionHref && (
                      <Link
                        href={`${logSessionHref}?toward=${o.id}`}
                        className="text-xs font-medium text-neuro-blue hover:underline"
                      >
                        Start learning
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingId(o.id)}
                      className="text-xs text-neuro-muted hover:text-neuro-silver"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => startTransition(() => archiveEducationOption(o.id))}
                      disabled={pending}
                      className="text-xs text-neuro-muted hover:text-amber-400 disabled:opacity-50"
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete this option permanently?")) {
                          startTransition(() => deleteEducationOption(o.id));
                        }
                      }}
                      disabled={pending}
                      className="text-xs text-red-400 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </span>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
      {archivedWithScore.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-neuro-muted">Archived</p>
          <ul className="space-y-2">
            {archivedWithScore.map((o) => (
              <li key={o.id} className="flex items-center justify-between rounded border border-neuro-border/60 bg-neuro-dark/40 px-3 py-2">
                <span className="text-sm text-neuro-muted">{o.name}</span>
                <button
                  type="button"
                  onClick={() => startTransition(() => unarchiveEducationOption(o.id))}
                  disabled={pending}
                  className="text-xs text-neuro-blue hover:underline disabled:opacity-50"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function EducationOptionEditForm({
  option,
  onClose,
  onSave,
}: {
  option: Option & { clarity: number };
  onClose: () => void;
  onSave: () => void;
  pending?: boolean;
}) {
  const [name, setName] = useState(option.name);
  const [interest, setInterest] = useState(String(option.interest_score ?? 5));
  const [futureValue, setFutureValue] = useState(String(option.future_value_score ?? 5));
  const [effort, setEffort] = useState(String(option.effort_score ?? 5));
  const [category, setCategory] = useState(option.category ?? "");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const i = parseInt(interest, 10);
    const f = parseInt(futureValue, 10);
    const eff = parseInt(effort, 10);
    if (!name.trim() || isNaN(i) || isNaN(f) || isNaN(eff)) return;
    startTransition(async () => {
      await updateEducationOption(option.id, {
        name: name.trim(),
        interest_score: Math.max(1, Math.min(10, i)),
        future_value_score: Math.max(1, Math.min(10, f)),
        effort_score: Math.max(1, Math.min(10, eff)),
        category: category.trim() || null,
      });
      onSave();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="min-w-[120px] rounded border border-neuro-border bg-neuro-dark px-2 py-1 text-sm text-neuro-silver"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="w-24 rounded border border-neuro-border bg-neuro-dark px-2 py-1 text-sm text-neuro-silver"
        />
        <input
          type="number"
          min="1"
          max="10"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="w-12 rounded border border-neuro-border bg-neuro-dark px-2 py-1 text-sm text-neuro-silver"
          title="Interest"
        />
        <input
          type="number"
          min="1"
          max="10"
          value={futureValue}
          onChange={(e) => setFutureValue(e.target.value)}
          className="w-12 rounded border border-neuro-border bg-neuro-dark px-2 py-1 text-sm text-neuro-silver"
          title="Future value"
        />
        <input
          type="number"
          min="1"
          max="10"
          value={effort}
          onChange={(e) => setEffort(e.target.value)}
          className="w-12 rounded border border-neuro-border bg-neuro-dark px-2 py-1 text-sm text-neuro-silver"
          title="Effort"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary rounded px-2 py-1 text-xs font-medium disabled:opacity-50">
          Save
        </button>
        <button type="button" onClick={onClose} className="rounded border border-neuro-border px-2 py-1 text-xs text-neuro-muted hover:text-neuro-silver">
          Cancel
        </button>
      </div>
    </form>
  );
}
