"use client";

import { useState } from "react";
import { exportLearningSessionsCSV } from "@/app/actions/learning";

export function LearningExportCSV() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const csv = await exportLearningSessionsCSV();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neurohq-learning-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="text-xs font-medium text-neuro-blue hover:underline disabled:opacity-50"
    >
      {loading ? "Exporting…" : "Export sessions (CSV)"}
    </button>
  );
}
