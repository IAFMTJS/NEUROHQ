"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetSkillsForUser } from "@/app/actions/learning";
import { toast } from "sonner";

export function SkillTreeRespec() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleRespec() {
    startTransition(async () => {
      const ok = await resetSkillsForUser();
      if (ok) {
        toast.success("Skills gereset.");
        router.refresh();
      }
      setShowConfirm(false);
    });
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
        >
          Reset skills (respec)
        </button>
      ) : (
        <>
          <span className="text-xs text-[var(--text-muted)]">Zeker? Skills worden gereset.</span>
          <button
            type="button"
            onClick={handleRespec}
            disabled={pending}
            className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/30 disabled:opacity-50"
          >
            {pending ? "Bezig…" : "Ja, reset"}
          </button>
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
          >
            Annuleren
          </button>
        </>
      )}
    </div>
  );
}
