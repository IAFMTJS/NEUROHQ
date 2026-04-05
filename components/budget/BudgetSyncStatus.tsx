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
    <div className="rounded-full border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.45)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {pending.synced ? "Synced" : "Pending sync"}
    </div>
  );
}

