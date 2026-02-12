"use client";

export function SettingsExport() {
  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Export data</h2>
      </div>
      <div className="p-4">
        <p className="text-sm text-neuro-muted">
          Download all your data (tasks, budget, learning, etc.) as JSON.
        </p>
        <a
          href="/api/export"
          download="neurohq-export.json"
          className="btn-primary mt-3 inline-block rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          Export my data
        </a>
      </div>
    </div>
  );
}
