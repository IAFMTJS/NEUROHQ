"use client";

import type { FC } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEducationOption } from "@/app/actions/learning";

export const AddLearningStreamCard: FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = title.trim();
    if (!name) return;

    startTransition(async () => {
      try {
        await createEducationOption({
          name,
          category: category.trim() || null,
        });
        setTitle("");
        // Keep category so you can add multiple in same area.
        router.refresh();
      } catch {
        // Errors are surfaced via toasts/logs elsewhere; keep this calm.
      }
    });
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Add learning stream</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Define a new skill, course, or topic you want to grow.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Stream name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TypeScript, Piano, UX Design"
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              disabled={pending}
              required
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Category (optional)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. work, personal"
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              disabled={pending}
            />
          </div>
          <button
            type="submit"
            disabled={pending || !title.trim()}
            className="mt-2 sm:mt-0 inline-flex items-center justify-center rounded-lg bg-[var(--accent-primary)] px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add stream"}
          </button>
        </div>
      </form>
    </section>
  );
};

