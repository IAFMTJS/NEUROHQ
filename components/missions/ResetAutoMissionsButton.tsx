"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetAutoMissionsForToday } from "@/app/actions/master-missions";

type Props = {
  dateStr: string;
};

export function ResetAutoMissionsButton({ dateStr }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const isToday = dateStr === today;

  if (!isToday) return null;

  async function handleReset() {
    setPending(true);
    try {
      const result = await resetAutoMissionsForToday();
      if (result.error) {
        console.error(result.error);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={pending}
      className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] disabled:opacity-50"
      title="Remove today's auto missions so the next load creates fresh ones (test diversity)"
    >
      {pending ? "Resetting…" : "Reset auto missions today"}
    </button>
  );
}
