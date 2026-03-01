"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTodayEngine } from "@/hooks/useTodayEngine";
import { createBehaviorMission } from "@/app/actions/behavior-missions";

export function BehaviorSuggestionsBanner() {
  const { result, isLoading, error, date } = useTodayEngine();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (isLoading || error || !result) return null;

  const { identity, pet, hobby } = result.behaviorSuggestions ?? {};
  const hasAny = identity || pet || hobby;
  if (!hasAny) return null;

  const handleCreate = (kind: "identity" | "pet" | "hobby") => {
    startTransition(async () => {
      await createBehaviorMission(kind);
      router.refresh();
    });
  };

  return (
    <section className="mt-3 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Behavior DNA · identity, pet, hobby
      </p>
      <div className="mt-1 space-y-2 text-sm text-[var(--text-secondary)]">
        {identity && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[var(--text-muted)]" aria-hidden>
              •
            </span>
            <span className="flex-1 min-w-[180px]">{identity}</span>
            <button
              type="button"
              onClick={() => handleCreate("identity")}
              disabled={pending}
              className="rounded-full border border-[var(--accent-focus)]/60 px-3 py-1 text-[11px] font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 disabled:opacity-50"
            >
              Zet als missie vandaag
            </button>
          </div>
        )}
        {pet && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[var(--text-muted)]" aria-hidden>
              •
            </span>
            <span className="flex-1 min-w-[180px]">{pet}</span>
            <button
              type="button"
              onClick={() => handleCreate("pet")}
              disabled={pending}
              className="rounded-full border border-[var(--accent-focus)]/60 px-3 py-1 text-[11px] font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 disabled:opacity-50"
            >
              Zet als missie vandaag
            </button>
          </div>
        )}
        {hobby && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[var(--text-muted)]" aria-hidden>
              •
            </span>
            <span className="flex-1 min-w-[180px]">{hobby}</span>
            <button
              type="button"
              onClick={() => handleCreate("hobby")}
              disabled={pending}
              className="rounded-full border border-[var(--accent-focus)]/60 px-3 py-1 text-[11px] font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 disabled:opacity-50"
            >
              Zet als missie vandaag
            </button>
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
        Geen to‑do lijst, maar een kompas: kies bewust maximaal één extra missie voor vandaag.
      </p>
    </section>
  );
}

