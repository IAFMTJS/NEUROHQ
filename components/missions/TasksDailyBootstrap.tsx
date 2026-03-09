"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  dateStr: string;
  enabled?: boolean;
};

export function TasksDailyBootstrap({ dateStr, enabled = true }: Props) {
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/tasks/daily-bootstrap", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dateStr }),
        });
        if (!res.ok) return;
        const result = (await res.json()) as {
          masterCreated?: number;
          readingCreated?: boolean;
        };
        if (!cancelled && ((result.masterCreated ?? 0) > 0 || result.readingCreated)) {
          router.refresh();
        }
      } catch {
        // Non-blocking progressive enhancement.
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [dateStr, enabled, router]);

  return null;
}
