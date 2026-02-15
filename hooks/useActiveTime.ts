"use client";

import { useEffect, useRef } from "react";
import { recordActiveSeconds } from "@/app/actions/analytics";

const REPORT_INTERVAL_MS = 60_000; // 1 min

/** Tracks active time (tab focused) and reports to analytics every minute. */
export function useActiveTime(enabled = true) {
  const accumulatedRef = useRef(0);
  const lastReportRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    function report() {
      if (accumulatedRef.current <= 0) return;
      const toReport = accumulatedRef.current;
      accumulatedRef.current = 0;
      lastReportRef.current = Date.now();
      recordActiveSeconds(toReport).catch(() => {});
    }

    function tick() {
      accumulatedRef.current += 1;
      const now = Date.now();
      if (now - lastReportRef.current >= REPORT_INTERVAL_MS) report();
    }

    function onFocus() {
      intervalId = setInterval(tick, 1000);
    }

    function onBlur() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      report();
    }

    if (document.hasFocus()) onFocus();
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      if (intervalId) clearInterval(intervalId);
      report();
    };
  }, [enabled]);
}
