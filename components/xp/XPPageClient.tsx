"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { XPDataProvider } from "@/components/providers/XPDataProvider";
import type { XPCachePayload } from "@/lib/xp-cache";
import { useXPData } from "@/components/providers/XPDataProvider";
import { XPBadge } from "@/components/XPBadge";

const XPPageContent = dynamic(() => import("@/components/xp/XPPageContent"), {
  loading: () => null,
});

type Props = {
  todayStr: string;
};

export function XPPageClient({ todayStr }: Props) {
  const snapshot = useDailySnapshot();
  const initialData: XPCachePayload | null = useMemo(() => {
    const xp = snapshot?.xp;
    if (!xp || xp.today !== todayStr) return null;
    return xp.cache;
  }, [snapshot?.xp, todayStr]);

  if (!todayStr) return null;

  return (
    <XPDataProvider initialDateStr={todayStr} initialData={initialData}>
      <XPPageContentContainer todayStr={todayStr} />
    </XPDataProvider>
  );
}

function XPPageContentContainer({ todayStr }: { todayStr: string }) {
  const ctx = useXPData();
  const data = ctx?.data ?? null;
  if (!data) return null;

  return (
    <div className="space-y-6" data-tutorial="xp-content">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <XPBadge totalXp={data.identity.total_xp} level={data.identity.level} compact href="/xp" />
      </div>
      <XPPageContent
        identity={data.identity as any}
        forecast={data.forecast as any}
        insightState={data.insightState as any}
        heatmapDays={data.heatmapDays as any}
        velocity={data.velocity}
        chartData={data.chartData as any}
        progress={data.progress}
        range={data.range as any}
        xpLast7={data.xpLast7}
        xpPrevious7={data.xpPrevious7}
        xpBySource={data.xpBySource as any}
        todayStr={todayStr}
        missionTemplates={data.missionTemplates as any}
        behaviorProfile={data.behaviorProfile as any}
        brainModeToday={data.brainModeToday as any}
        activeMissionCountToday={data.activeMissionCountToday}
      />
    </div>
  );
}

