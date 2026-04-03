"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { getTodayKey } from "@/lib/daily-date";
import { XPBadge } from "@/components/XPBadge";
import { InsightsKeyNumbersStrip } from "@/components/insights";

type AnalyticsSlice = {
  today: string;
  payload: unknown;
};

/**
 * Suspense fallback for Report/Insights: show key numbers quickly.
 * `useDailySnapshot()` is frozen at first paint; we also fetch `/api/analytics/snapshot`
 * on mount and when the tab becomes visible so returning users do not see stale KPIs.
 */
export function ReportSnapshotFallback() {
  const snapshot = useDailySnapshot();
  const todayKey = getTodayKey();
  const [live, setLive] = useState<AnalyticsSlice | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchLive = useCallback(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    void (async () => {
      try {
        const res = await fetch("/api/analytics/snapshot", {
          credentials: "include",
          cache: "no-store",
          signal: ac.signal,
        });
        if (!res.ok) return;
        const j = (await res.json()) as { today?: string; payload?: unknown };
        if (typeof j?.today === "string" && j.payload != null && typeof j.payload === "object") {
          setLive({ today: j.today, payload: j.payload });
        }
      } catch {
        // aborted or network
      }
    })();
  }, []);

  useEffect(() => {
    fetchLive();
    return () => abortRef.current?.abort();
  }, [fetchLive]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") fetchLive();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [fetchLive]);

  const analytics = useMemo(() => {
    if (live?.today === todayKey && live.payload) {
      return { today: live.today, payload: live.payload };
    }
    const s = snapshot?.analytics;
    if (s && s.today === todayKey && s.payload) {
      return { today: s.today, payload: s.payload };
    }
    return null;
  }, [live, snapshot?.analytics, todayKey]);

  if (!analytics || !analytics.payload) {
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
        <XPBadge totalXp={xp.total_xp} level={xp.level} compact href="/profile" />
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
