"use client";

import { useEffect, useRef } from "react";
import { getAndClearPendingXpNotification } from "@/app/actions/pending-xp-notification";
import { NEUROHQ_ALERTS_UPDATED } from "@/lib/bootstrap-query";
import { neuroToast } from "@/lib/ui/neuro-toast";

/** On mount, fetches any pending XP notification (from automatic XP) and shows a one-time toast. */
export function PendingXpToast() {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    getAndClearPendingXpNotification()
      .then((notification) => {
        if (!notification || notification.totalXp <= 0) return;

        const lines = notification.sources.length
          ? notification.sources.map((s) => `${s.label}: +${s.xp} XP`).join(" · ")
          : `+${notification.totalXp} XP`;

        neuroToast.success(
          notification.forDate
            ? `Verdiend (${notification.forDate}): ${lines} — Totaal +${notification.totalXp} XP`
            : `XP verdiend: ${lines} — Totaal +${notification.totalXp} XP`,
          { duration: 6000 }
        );
        try {
          window.dispatchEvent(new CustomEvent(NEUROHQ_ALERTS_UPDATED));
        } catch {
          // ignore
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
