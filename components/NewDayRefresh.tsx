"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function getLocalDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * When the calendar day changes (e.g. 00:00), refresh so the app shows:
 * new quote, fresh brain status for the new date, and rolled-over tasks.
 */
export function NewDayRefresh() {
  const router = useRouter();
  const lastDateRef = useRef<string>(getLocalDateStr());

  useEffect(() => {
    function check() {
      const now = getLocalDateStr();
      if (lastDateRef.current !== now) {
        lastDateRef.current = now;
        router.refresh();
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
