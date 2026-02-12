"use client";

export function SettingsGoogleCalendar({ hasToken }: { hasToken: boolean }) {
  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Google Calendar</h2>
      </div>
      <div className="p-4">
        <p className="text-sm text-neuro-muted">
          {hasToken
            ? "Connected. Events sync when you open the dashboard or click Sync."
            : "Connect your Google Calendar to see events on the dashboard and in your energy budget."}
        </p>
        <div className="mt-3">
          {hasToken ? (
            <p className="text-xs text-neuro-muted">To disconnect, remove access in your Google account settings.</p>
          ) : (
            <a
              href="/api/auth/google"
              className="btn-primary inline-block rounded-lg px-4 py-2.5 text-sm font-medium"
            >
              Connect Google Calendar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
