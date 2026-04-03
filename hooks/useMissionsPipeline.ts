"use client";

import { useShallow } from "zustand/react/shallow";
import { useHQStore } from "@/lib/hq-store";
import type { MissionsPipelinePayload } from "@/lib/missions/derive-mission-capacity";

/**
 * Smalle subscription op de missions-pipeline (UMS + capacity) in de HQ store.
 * Gebruik dit i.p.v. brede `useHQStore()` waar je alleen missions nodig hebt.
 */
export function useMissionsPipeline(): {
  missionsPipeline: MissionsPipelinePayload | null;
  setMissionsPipeline: (payload: MissionsPipelinePayload | null) => void;
} {
  return useHQStore(
    useShallow((s) => ({
      missionsPipeline: s.missionsPipeline,
      setMissionsPipeline: s.setMissionsPipeline,
    }))
  );
}
