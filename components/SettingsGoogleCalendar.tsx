"use client";

export function SettingsGoogleCalendar({ hasToken }: { hasToken: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <h2 className="text-sm font-medium text-neuro-silver">Google Calendar</h2>
      <p className="mt-2 text-sm text-neutral-400">
        {hasToken
          ? "Connected. Events sync when you open the dashboard or click Sync."
          : "Connect your Google Calendar to see events on the dashboard and in your energy budget."}
      </p>
      <div className="mt-3">
        {hasToken ? (
          <p className="text-xs text-neutral-500">To disconnect, remove access in your Google account settings.</p>
        ) : (
          <a
            href="/api/auth/google"
            className="inline-block rounded bg-neuro-blue px-3 py-1.5 text-sm text-white hover:bg-neuro-blue/90"
          >
            Connect Google Calendar
          </a>
        )}
      </div>
    </div>
  );
}
