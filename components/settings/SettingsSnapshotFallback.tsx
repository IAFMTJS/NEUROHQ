"use client";

import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { getTodayKey } from "@/lib/daily-date";
import { getLoadingMascotSrc } from "@/lib/mascots";

/**
 * First-paint content for the Settings page from DailySnapshot.settings.
 * Used as Suspense fallback so users see settings-derived content immediately when opening from cache.
 */
export function SettingsSnapshotFallback() {
  const snapshot = useDailySnapshot();
  const settings = snapshot?.settings;
  const todayKey = getTodayKey();

  if (!settings || settings.today !== todayKey) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <div className="h-12 w-12 rounded-full border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(6,18,30,0.42)] p-1.5">
            <img src={getLoadingMascotSrc()} alt="" aria-hidden className="h-full w-full object-contain" />
          </div>
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-white/10" aria-hidden />
        <p className="text-sm text-[var(--text-muted)]">Instellingen laden…</p>
      </div>
    );
  }

  const payday = settings.payday ?? { last_payday_date: null, payday_day_of_month: null };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="h-12 w-12 rounded-full border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(6,18,30,0.42)] p-1.5">
          <img src={getLoadingMascotSrc()} alt="" aria-hidden className="h-full w-full object-contain" />
        </div>
      </div>
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Instellingen (van cache)</h2>
        <div className="card-simple overflow-hidden p-0">
          <div className="p-4 space-y-2">
            {payday.last_payday_date != null && (
              <p className="text-sm text-[var(--text-secondary)]">
                Laatste loondag: {String(payday.last_payday_date)}
              </p>
            )}
            <p className="text-sm text-[var(--text-muted)]">Volledige instellingen laden…</p>
          </div>
        </div>
      </section>
    </div>
  );
}
