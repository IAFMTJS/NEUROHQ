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
      className="text-sm font-medium text-[var(--accent-focus)] hover:underline disabled:opacity-50"
      aria-label="Export budget as CSV"
    >
      {pending ? "Exporting…" : "Export CSV"}
    </button>
  );
}
