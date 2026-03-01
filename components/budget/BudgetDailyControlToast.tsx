"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const STORAGE_KEY_PREFIX = "budget_daily_control_toast_";

/** Shows a once-per-day toast on Budget Overview about daily control missions being auto-completed at end of day. */
export function BudgetDailyControlToast() {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = STORAGE_KEY_PREFIX + today;
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
      shown.current = true;
      toast.info("Daily control-missies worden aan het einde van de dag automatisch afgevinkt als je aan de criteria voldoet.", {
        duration: 6000,
        id: key,
      });
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }
  }, []);

  return null;
}
