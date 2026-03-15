"use client";

import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { getTodayKey } from "@/lib/daily-date";
import { XPBadge } from "@/components/XPBadge";
import { InsightsKeyNumbersStrip } from "@/components/insights";

/**
 * First-paint content for the Report/Insights page from DailySnapshot.analytics.
 * Used as Suspense fallback so users see key numbers immediately when opening from cache.
 */
export function ReportSnapshotFallback() {
  const snapshot = useDailySnapshot();
  const analytics = snapshot?.analytics;
  const todayKey = getTodayKey();

  if (!analytics || analytics.today !== todayKey || !analytics.payload) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" aria-hidden />
        <p className="text-sm text-[var(--text-muted)]">Insights laden…</p>
      </div>
    );
  }

  const payload = analytics.payload as {
    xpContext?: {
      xp?: { total_xp: number; level: number };
      identity?: { streak: { current: number; longest: number } };
      insightState?: {
        xpLast7: number;
        completionRateLast7: number | null;
        bestDayOfWeek: number | null;
      };
    };
    graph30Data?: {
      xpLast30: number;
      missionsLast7: number;
      missionsLast30: number;
    };
  };

  const xpContext = payload.xpContext;
  const graph30Data = payload.graph30Data;
  const insightState = xpContext?.insightState;
  const identity = xpContext?.identity;
  const xp = xpContext?.xp;

  if (!insightState || !identity || !xp || !graph30Data) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" aria-hidden />
        <p className="text-sm text-[var(--text-muted)]">Insights laden…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <XPBadge totalXp={xp.total_xp} level={xp.level} compact href="/xp" />
      </div>
      <InsightsKeyNumbersStrip
        xpLast7={insightState.xpLast7}
        xpLast30={graph30Data.xpLast30}
        missionsLast7={graph30Data.missionsLast7}
        missionsLast30={graph30Data.missionsLast30}
        velocity7={insightState.xpLast7 / 7}
        completionRatePct={insightState.completionRateLast7 != null ? Math.round(insightState.completionRateLast7 * 100) : null}
        currentStreak={identity.streak.current}
        longestStreak={identity.streak.longest}
        bestDayOfWeek={insightState.bestDayOfWeek}
      />
      <p className="text-sm text-[var(--text-muted)]">Volledige insights laden…</p>
    </div>
  );
}
