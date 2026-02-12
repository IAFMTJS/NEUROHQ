"use client";

import { useState } from "react";
import { exportStrategyMarkdown } from "@/app/actions/strategy";

export function StrategyExportButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const md = await exportStrategyMarkdown();
      if (!md) return;
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const d = new Date();
const q = Math.floor(d.getMonth() / 3) + 1;
a.download = `strategy-q${q}-${d.getFullYear()}.md`;
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
      className="text-sm font-medium text-neuro-blue hover:underline disabled:opacity-50"
    >
      {loading ? "Exporting…" : "Export (Markdown)"}
    </button>
  );
}
