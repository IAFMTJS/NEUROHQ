"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * When the user opens the app from a push notification (URL has from_push=1 and tag),
 * report the click to the server so we can adapt the daily push cap (fatigue).
 */
export function PushClickTracker() {
  const searchParams = useSearchParams();
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) return;
    const fromPush = searchParams.get("from_push");
    const tag = searchParams.get("tag");
    if (fromPush !== "1" || !tag) return;

    reported.current = true;
    fetch("/api/push/clicked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
      credentials: "same-origin",
    }).catch(() => {
      reported.current = false;
    });
  }, [searchParams]);

  return null;
}
