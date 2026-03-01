"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTodayEngine } from "@/hooks/useTodayEngine";
import { createMinimalIntegrityMission } from "@/app/actions/behavior-missions";

export function MinimalIntegrityBanner() {
  const { data, result } = useTodayEngine();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const minimal = result?.minimalIntegrity ?? data?.minimalIntegrity ?? null;

  if (!minimal || !minimal.active) return null;
  if (result?.forcedConfrontation) return null;

  const handleCreate = () => {
    startTransition(async () => {
      await createMinimalIntegrityMission();
      router.refresh();
    });
  };

  return (
    <section className="mt-3 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/90 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Minimal Integrity · anti‑escape
      </p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Je was {minimal.daysInactive}+ dagen niet actief. Dit is geen oordeel, wel een uitnodiging:
        kies één micro‑missie van 2–3 minuten om het patroon vandaag te doorbreken.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={pending}
          className="rounded-full bg-[var(--accent-focus)] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
        >
          {pending ? "Bezig…" : "Zet Minimal Integrity‑missie voor vandaag"}
        </button>
        <p className="text-[10px] text-[var(--text-muted)]">
          Geen straf, alleen een klein eerlijk signaal aan jezelf.
        </p>
      </div>
    </section>
  );
}

