"use client";

import { useMemo } from "react";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";

type Summary = {
  today: string;
  hasPayload: boolean;
  payloadKeys: number;
};

export function AnalyticsSnapshotFallback() {
  const snapshot = useDailySnapshot();
  const summary: Summary | null = useMemo(() => {
    if (!snapshot?.analytics) return null;
    const today = (snapshot.analytics as any)?.today ?? snapshot.date;
    const payload = (snapshot.analytics as any)?.payload ?? null;
    const keys = payload && typeof payload === "object" ? Object.keys(payload).length : 0;
    return { today, hasPayload: !!payload, payloadKeys: keys };
  }, [snapshot]);

  return (
    <section className="glass-card p-4">
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

