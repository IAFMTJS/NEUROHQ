"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";

export function SettingsExport() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/export", { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "neurohq-export.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
      setOpen(true);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Export failed");
    }
  }

  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Export data</h2>
      </div>
      <div className="p-4">
        <p className="text-sm text-[var(--text-muted)]">
          Download all your data (tasks, budget, learning, etc.) as JSON.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={status === "loading"}
          className="btn-primary mt-3 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {status === "loading" ? "Exporting…" : "Export my data"}
        </button>
        {error && <p className="mt-2 text-sm text-red-400" role="alert">{error}</p>}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Export complete" showBranding={false}>
        <p className="text-sm text-[var(--text-primary)]">
          Your data has been downloaded as neurohq-export.json.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
