"use client";

import { useEffect, useState } from "react";
import { getCalendarFeedUrl } from "@/app/actions/calendar";

export function SettingsAppleCalendar() {
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCalendarFeedUrl().then((path) => {
      if (cancelled || !path) return;
      setFeedUrl(typeof window !== "undefined" ? window.location.origin + path : path);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const copyUrl = () => {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const today = new Date().toISOString().slice(0, 10);
  const exportUrl = `/api/calendar/export?from=${today}&to=${today}`;

  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">iOS / Apple Kalender</h2>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm text-[var(--text-muted)]">
          Je agenda in de Apple Kalender-app (iPhone, iPad, Mac). Eénmalig instellen, daarna verschijnen events automatisch.
        </p>

        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Abonnement-URL (kopieer en plak in Apple Kalender)</p>
          {feedUrl ? (
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)]"
                aria-label="Feed-URL voor Apple Kalender"
              />
              <button
                type="button"
                onClick={copyUrl}
                className="shrink-0 rounded-lg bg-[var(--accent-focus)] px-3 py-2 text-xs font-medium text-[var(--bg-primary)]"
              >
                {copied ? "Gekopieerd" : "Kopieer"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">URL laden…</p>
          )}
        </div>

        <div className="text-xs text-[var(--text-muted)] space-y-1">
          <p className="font-medium text-[var(--text-primary)]">Op iPhone / iPad:</p>
          <p>Instellingen → Kalenders → Abonnement toevoegen → plak de URL.</p>
          <p className="font-medium text-[var(--text-primary)] mt-2">Op Mac:</p>
          <p>Apple Kalender → Bestand → Nieuw abonnement op kalender → plak de URL.</p>
        </div>

        <div className="pt-2 border-t border-[var(--card-border)]">
          <p className="text-xs text-[var(--text-muted)] mb-2">Eenmalige export (bv. om handmatig toe te voegen):</p>
          <a
            href={exportUrl}
            download
            className="inline-block rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            Exporteer vandaag (.ics)
          </a>
        </div>
      </div>
    </div>
  );
}
