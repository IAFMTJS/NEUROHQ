"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getAndClearPendingXpNotification } from "@/app/actions/pending-xp-notification";

/** On mount, fetches any pending XP notification (from automatic XP) and shows a one-time toast. */
export function PendingXpToast() {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    getAndClearPendingXpNotification().then((notification) => {
      if (!notification || notification.totalXp <= 0) return;

      const lines = notification.sources.length
        ? notification.sources.map((s) => `${s.label}: +${s.xp} XP`).join(" · ")
        : `+${notification.totalXp} XP`;

      toast.success(
        notification.forDate
          ? `Verdiend (${notification.forDate}): ${lines} — Totaal +${notification.totalXp} XP`
          : `XP verdiend: ${lines} — Totaal +${notification.totalXp} XP`,
        { duration: 6000 }
      );
    });
  }, []);

  return null;
}
