"use client";

import { useActiveTime } from "@/hooks/useActiveTime";

/** Renders nothing; tracks active time when mounted (e.g. in dashboard layout). */
export function ActiveTimeTracker() {
  useActiveTime(true);
  return null;
}
