"use client";

import Link from "next/link";
import { toast } from "sonner";
import { NeuroToastIcon } from "@/components/brand/NeuroToastIcon";

function missionsHref(taskId: string, opts: { focus: boolean }): string {
  const p = new URLSearchParams();
  p.set("tab", "missions");
  p.set("openTask", taskId);
  if (opts.focus) p.set("focusMission", "1");
  return `/tasks?${p.toString()}`;
}

/**
 * Dashboard CTA: toon eerste missie in een rich toast met directe link naar focus of details op /tasks.
 */
export function toastDashboardFirstMission(task: { id: string; title: string }): void {
  const hrefFocus = missionsHref(task.id, { focus: true });
  const hrefDetails = missionsHref(task.id, { focus: false });
  const toastId = `dash-first-mission-${task.id}`;

  toast.custom(
    (id) => (
      <div
        className="hq-toast flex w-[min(100vw-2rem,22rem)] flex-col gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4 shadow-lg"
      >
        <div className="flex gap-3">
          <div className="shrink-0 pt-0.5">
            <NeuroToastIcon variant="info" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-focus)]">
              Eerste missie vandaag
            </p>
            <p className="mt-1 line-clamp-3 text-sm font-medium leading-snug text-[var(--text-primary)]">{task.title}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-[var(--border-soft)] pt-3">
          <Link
            href={hrefFocus}
            className="btn-primary inline-flex min-h-0 flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-center text-xs font-semibold no-underline"
            onClick={() => toast.dismiss(id)}
          >
            Start nu
          </Link>
          <Link
            href={hrefDetails}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-center text-xs font-medium text-[var(--text-secondary)] no-underline transition hover:border-[rgba(var(--mode-rgb),0.28)] hover:text-[var(--text-primary)]"
            onClick={() => toast.dismiss(id)}
          >
            Details
          </Link>
        </div>
        <button
          type="button"
          className="text-center text-[10px] font-medium text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-secondary)] hover:underline"
          onClick={() => toast.dismiss(id)}
        >
          Sluiten
        </button>
      </div>
    ),
    { id: toastId, duration: 30_000 }
  );
}
