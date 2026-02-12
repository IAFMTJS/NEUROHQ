"use client";

export function SettingsExport() {
  return (
    <div className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <h2 className="text-sm font-medium text-neuro-silver">Export data</h2>
      <p className="mt-2 text-sm text-neutral-400">
        Download all your data (tasks, budget, learning, etc.) as JSON.
      </p>
      <a
        href="/api/export"
        download="neurohq-export.json"
        className="mt-3 inline-block rounded bg-neuro-blue px-3 py-2 text-sm text-white hover:opacity-90"
      >
        Export my data
      </a>
    </div>
  );
}
