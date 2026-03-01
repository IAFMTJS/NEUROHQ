"use client";

import { useState } from "react";

type Props = {
  energyPct: number;
  focusPct: number;
  loadPct: number;
  date?: string;
};

export function StatRingsExport({ energyPct, focusPct, loadPct, date }: Props) {
  const [copied, setCopied] = useState(false);

  const csvRow = [
    date ?? new Date().toISOString().slice(0, 10),
    "energy",
    (energyPct / 10).toFixed(1),
    energyPct.toString(),
  ];
  const csvRow2 = [date ?? new Date().toISOString().slice(0, 10), "focus", (focusPct / 10).toFixed(1), focusPct.toString()];
  const csvRow3 = [date ?? new Date().toISOString().slice(0, 10), "load", (loadPct / 10).toFixed(1), loadPct.toString()];
  const header = "date,metric,value_abs,value_pct";
  const csv = [header, csvRow.join(","), csvRow2.join(","), csvRow3.join(",")].join("\n");

  function handleCopy() {
    navigator.clipboard.writeText(csv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `neurohq-stats-${date ?? new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <button
        type="button"
        onClick={handleCopy}
        className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline"
      >
        {copied ? "Gekopieerd" : "Kopieer stats"}
      </button>
      <span className="text-[var(--text-muted)]/50">·</span>
      <button
        type="button"
        onClick={handleDownload}
        className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline"
      >
        Download CSV
      </button>
    </div>
  );
}
