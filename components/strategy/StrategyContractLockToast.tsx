"use client";

import { useEffect } from "react";
import { neuroToast } from "@/lib/ui/neuro-toast";

const SESSION_KEY = "neurohq-strategy-contract-lock-toast";

function scrollToContract() {
  if (typeof window === "undefined") return;
  window.location.hash = "strategy-contract";
  requestAnimationFrame(() => {
    document.getElementById("strategy-contract")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/** Eén waarschuwing per sessie zolang het contract ontbreekt; actie scrollt naar #strategy-contract. */
export function StrategyContractLockToast({ show }: { show: boolean }) {
  useEffect(() => {
    if (!show) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        /* private mode */
      }
      return;
    }

    let skip = false;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") skip = true;
      else sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* toon toast ook zonder storage */
    }
    if (skip) return;

    neuroToast.warning("Vul je kwartaal contract in om Strategy te ontgrendelen.", {
      duration: 14_000,
      action: {
        label: "Naar contract",
        onClick: () => scrollToContract(),
      },
    });
  }, [show]);

  return null;
}
