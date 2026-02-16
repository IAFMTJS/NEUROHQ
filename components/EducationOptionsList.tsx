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
          <li className="list-none">
            <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-6 text-center">
              <p className="text-sm text-[var(--text-muted)]">Nog geen opleidingen of opties.</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Voeg er hierboven een toe om ze op helderheid te vergelijken.</p>
            </div>
          </li>
        ) : (
          activeWithScore.map((o) => (
            <li key={o.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)] px-3 py-2">
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
                    <span className="text-sm font-medium text-[var(--text-primary)]">{o.name}</span>
                    {o.category && (
                      <span className="ml-2 text-xs text-[var(--text-muted)]">{o.category}</span>
                    )}
                    <span className="ml-2 text-xs text-[var(--text-muted)]">
                      Clarity: {o.clarity} (I:{o.interest_score ?? "-"} F:{o.future_value_score ?? "-"} E:{o.effort_score ?? "-"})
                    </span>
                  </div>
                  <span className="flex items-center gap-2">
                    {logSessionHref && (
                      <Link
                        href={`${logSessionHref}?toward=${o.id}`}
                        className="text-xs font-medium text-[var(--accent-focus)] hover:underline"
                      >
                        Start learning
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingId(o.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => startTransition(() => archiveEducationOption(o.id))}
                      disabled={pending}
                      className="text-xs text-[var(--text-muted)] hover:text-amber-400 disabled:opacity-50"
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
          <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Archived</p>
          <ul className="space-y-2">
            {archivedWithScore.map((o) => (
              <li key={o.id} className="flex items-center justify-between rounded border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/40 px-3 py-2">
                <span className="text-sm text-[var(--text-muted)]">{o.name}</span>
                <button
                  type="button"
                  onClick={() => startTransition(() => unarchiveEducationOption(o.id))}
                  disabled={pending}
                  className="text-xs text-[var(--accent-focus)] hover:underline disabled:opacity-50"
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
          className="min-w-[120px] rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="w-24 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
        />
        <input
          type="number"
          min="1"
          max="10"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="w-12 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
          title="Interest"
        />
        <input
          type="number"
          min="1"
          max="10"
          value={futureValue}
          onChange={(e) => setFutureValue(e.target.value)}
          className="w-12 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
          title="Future value"
        />
        <input
          type="number"
          min="1"
          max="10"
          value={effort}
          onChange={(e) => setEffort(e.target.value)}
          className="w-12 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-sm text-[var(--text-primary)]"
          title="Effort"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary rounded px-2 py-1 text-xs font-medium disabled:opacity-50">
          Save
        </button>
        <button type="button" onClick={onClose} className="btn-secondary rounded px-2 py-1 text-xs font-medium">
          Cancel
        </button>
      </div>
    </form>
  );
}
