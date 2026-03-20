"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import type { TaskWithMeta, TaskWithUMS } from "@/app/actions/missions-performance";

type Props = {
  recovery: TaskWithMeta[];
  alignmentFix: TaskWithMeta[];
  topRoi: TaskWithUMS[];
};

function firstTitle<T extends { title?: string | null }>(rows: T[]): string | null {
  const value = rows[0]?.title ?? null;
  return value && value.trim().length > 0 ? value : null;
}

export function SystemSuggestionsInline({ recovery, alignmentFix, topRoi }: Props) {
  const [open, setOpen] = useState(false);
  const recoveryTitle = firstTitle(recovery);
  const alignmentTitle = firstTitle(alignmentFix);
  const roiTitle = firstTitle(topRoi);
  const hasAny = !!(recoveryTitle || alignmentTitle || roiTitle);
  if (!hasAny) return null;

  return (
    <>
      <section aria-label="System suggestions" className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">System suggestions</p>
        <ul className="space-y-1.5 text-sm text-[var(--text-primary)]">
          {recoveryTitle && <li>Recovery - {recoveryTitle}</li>}
          {alignmentTitle && <li>Alignment fix - {alignmentTitle}</li>}
          {roiTitle && <li>High ROI - {roiTitle}</li>}
        </ul>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-[var(--accent-focus)] hover:underline"
        >
          View reasoning
        </button>
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title="Suggestion reasoning" size="md">
        <div className="space-y-3 text-sm text-[var(--text-primary)]">
          {recoveryTitle && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Recovery</h4>
              <p className="mt-1">{recoveryTitle}</p>
            </section>
          )}
          {alignmentTitle && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Alignment fix</h4>
              <p className="mt-1">{alignmentTitle}</p>
            </section>
          )}
          {roiTitle && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">High ROI</h4>
              <p className="mt-1">{roiTitle}</p>
            </section>
          )}
        </div>
      </Modal>
    </>
  );
}
