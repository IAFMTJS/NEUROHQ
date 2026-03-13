"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { XPDataProvider } from "@/components/providers/XPDataProvider";
import type { XPCachePayload } from "@/lib/xp-cache";
import { useXPData } from "@/components/providers/XPDataProvider";
import { XPBadge } from "@/components/XPBadge";
import { MascotImg } from "@/components/MascotImg";
import { getXPMascotState } from "@/lib/mascots";

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
      <XPPageContentContainer />
    </XPDataProvider>
  );
}

function XPPageContentContainer() {
  const ctx = useXPData();
  const data = ctx?.data ?? null;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <XPBadge totalXp={data.identity.total_xp} level={data.identity.level} compact href="/xp" />
      </div>
      <section className="xp-mascot-hero" data-mascot-page="xp" aria-hidden>
        <div className="xp-mascot-frame">
          <MascotImg
            page="xp"
            state={getXPMascotState((data.brainModeToday as any)?.mode)}
            className="xp-mascot-img"
          />
        </div>
      </section>
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
        todayStr={data.todayStr}
        missionTemplates={data.missionTemplates as any}
        behaviorProfile={data.behaviorProfile as any}
        brainModeToday={data.brainModeToday as any}
        activeMissionCountToday={data.activeMissionCountToday}
      />
    </div>
  );
}

