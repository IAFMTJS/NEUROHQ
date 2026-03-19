"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSnapshotValidityDayKey } from "@/lib/daily-date";

/**
 * When the local snapshot validity day rolls over (after 00:01 — see
 * `getSnapshotValidityDayKey`), refresh so the app shows new quote, brain
 * status, and rolled-over tasks in line with the daily snapshot boundary.
 */
export function NewDayRefresh() {
  const router = useRouter();
  const lastDateRef = useRef<string>(getSnapshotValidityDayKey());

  useEffect(() => {
    function check() {
      const now = getSnapshotValidityDayKey();
      if (lastDateRef.current !== now) {
        lastDateRef.current = now;
        // Force a full reload so all server data, caches and client state
        // are reset for the new day. This behaves like "empty cache" for the PWA.
        if (typeof window !== "undefined") {
          window.location.reload();
        } else {
          router.refresh();
        }
      }
    }

    const interval = setInterval(check, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  return null;
}
