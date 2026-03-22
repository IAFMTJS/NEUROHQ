"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getUserTimezone, syncUserTimezoneFromBrowser } from "@/app/actions/auth";

/** Auto-detects IANA timezone when missing; shows a dismissible banner if still unset. */
export function TimezoneSyncBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let tz = await getUserTimezone();
        if (cancelled || (tz && String(tz).trim())) return;
        const guessed = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
        if (guessed) {
          const r = await syncUserTimezoneFromBrowser(guessed);
          if (r.ok && !r.skipped) {
            toast.success("Tijdzone ingesteld voor meldingen en je dag.");
            return;
          }
        }
        tz = await getUserTimezone();
        if (!cancelled && (!tz || !String(tz).trim())) setShow(true);
      } catch {
        if (!cancelled) setShow(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show || dismissed) return null;

  return (
    <div
      role="status"
      className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
    >
      <span>
        Zet je <strong>tijdzone</strong> voor meldingen en &quot;vandaag&quot; op het juiste uur.
      </span>
      <div className="flex items-center gap-2">
        <Link href="/settings" className="font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline">
          Instellingen
        </Link>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-white/5"
          onClick={() => setDismissed(true)}
        >
          Sluiten
        </button>
      </div>
    </div>
  );
}
