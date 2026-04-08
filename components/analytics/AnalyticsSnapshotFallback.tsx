"use client";

import { useMemo } from "react";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { useBootstrapToday } from "@/lib/use-bootstrap-today";
import { getTodayKey } from "@/lib/daily-date";
import { getLoadingMascotSrc } from "@/lib/mascots";

type Summary = {
  today: string;
  hasPayload: boolean;
  payloadKeys: number;
};

export function AnalyticsSnapshotFallback() {
  const snapshot = useDailySnapshot();
  const dateKey = snapshot?.date?.trim() || getTodayKey();
  const { data: bootstrapToday } = useBootstrapToday(dateKey, { variant: "core" });
  const effectiveDate =
    (typeof bootstrapToday?.date === "string" && bootstrapToday.date.trim()) || snapshot?.date || getTodayKey();

  const summary: Summary | null = useMemo(() => {
    if (!snapshot?.analytics) return null;
    const today = (snapshot.analytics as { today?: string }).today ?? effectiveDate;
    const payload = (snapshot.analytics as { payload?: unknown }).payload ?? null;
    const keys = payload && typeof payload === "object" ? Object.keys(payload as object).length : 0;
    return { today, hasPayload: !!payload, payloadKeys: keys };
  }, [snapshot, effectiveDate]);

  return (
    <section className="glass-card p-4">
      <div className="mb-3 flex justify-end">
        <div className="h-12 w-12 rounded-full border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(6,18,30,0.42)] p-1.5">
          <img src={getLoadingMascotSrc()} alt="" aria-hidden className="h-full w-full object-contain" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
        Loading analytics
      </p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {summary
          ? `Showing cached snapshot for ${summary.today} (${summary.hasPayload ? `${summary.payloadKeys} blocks` : "no payload"}).`
          : "Preparing cached snapshot…"}
      </p>
    </section>
  );
}

