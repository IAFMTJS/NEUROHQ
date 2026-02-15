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
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">iOS / Apple Kalender</h2>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm text-neuro-muted">
          Je agenda in de Apple Kalender-app (iPhone, iPad, Mac). Eénmalig instellen, daarna verschijnen events automatisch.
        </p>

        <div>
          <p className="text-xs font-medium text-neuro-muted mb-1">Abonnement-URL (kopieer en plak in Apple Kalender)</p>
          {feedUrl ? (
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="flex-1 rounded-lg border border-neuro-border bg-neuro-card px-3 py-2 text-xs text-neuro-silver"
                aria-label="Feed-URL voor Apple Kalender"
              />
              <button
                type="button"
                onClick={copyUrl}
                className="shrink-0 rounded-lg bg-neuro-accent px-3 py-2 text-xs font-medium text-neuro-bg"
              >
                {copied ? "Gekopieerd" : "Kopieer"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-neuro-muted">URL laden…</p>
          )}
        </div>

        <div className="text-xs text-neuro-muted space-y-1">
          <p className="font-medium text-neuro-silver">Op iPhone / iPad:</p>
          <p>Instellingen → Kalenders → Abonnement toevoegen → plak de URL.</p>
          <p className="font-medium text-neuro-silver mt-2">Op Mac:</p>
          <p>Apple Kalender → Bestand → Nieuw abonnement op kalender → plak de URL.</p>
        </div>

        <div className="pt-2 border-t border-neuro-border">
          <p className="text-xs text-neuro-muted mb-2">Eenmalige export (bv. om handmatig toe te voegen):</p>
          <a
            href={exportUrl}
            download
            className="inline-block rounded-lg border border-neuro-border bg-neuro-card px-3 py-2 text-xs font-medium text-neuro-silver hover:bg-neuro-elevated"
          >
            Exporteer vandaag (.ics)
          </a>
        </div>
      </div>
    </div>
  );
}
