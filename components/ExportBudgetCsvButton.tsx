"use client";

import { useState } from "react";
import { exportBudgetCsv } from "@/app/actions/budget";

export function ExportBudgetCsvButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const csv = await exportBudgetCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neurohq-budget-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md border border-[rgba(var(--mode-rgb),0.22)] bg-[var(--bg-elevated)]/45 px-2 py-1 text-[11px] font-medium text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.35)] focus-visible:ring-offset-0 disabled:opacity-50"
      aria-label="Export budget as CSV"
    >
      {pending ? "Exporting…" : "Export CSV"}
    </button>
  );
}
