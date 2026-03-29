"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePendingBudgetSnapshot } from "@/lib/client-pending-budget";

type Props = {
  historyMode?: boolean;
  /** When true, only run sync toasts — no pill (e.g. Budget command header shows status). */
  suppressChrome?: boolean;
};

export function BudgetSyncStatus({ historyMode = false, suppressChrome = false }: Props) {
  const pending = usePendingBudgetSnapshot();
  const lastSeenRef = useRef<number | null>(null);

  useEffect(() => {
    if (historyMode || !pending) return;
    if (pending.synced) return;
    if (lastSeenRef.current === pending.updatedAt) return;
    lastSeenRef.current = pending.updatedAt;
    toast.info("Budget changes pending sync. We will refresh from server truth after save.", {
      duration: 4500,
    });
  }, [historyMode, pending]);

  if (suppressChrome || historyMode || !pending) return null;

  return (
    <div className="rounded-full border border-[var(--card-border)] bg-[var(--bg-surface)]/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
      {pending.synced ? "Synced" : "Pending sync"}
    </div>
  );
}

