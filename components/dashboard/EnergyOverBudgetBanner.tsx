"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Modal } from "@/components/Modal";

const STORAGE_KEY = "neurohq-energy-over-budget-modal";

/** Show a one-time modal popup when energy budget is exceeded (remaining < 0). Uses sessionStorage so we don't spam on every refresh. */
export function EnergyOverBudgetBanner({ remaining, dateStr }: { remaining: number; dateStr: string }) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (remaining >= 0) return;
    const key = `${STORAGE_KEY}-${dateStr}`;
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key) === "1") return;
      setShowModal(true);
    } catch {
      setShowModal(true);
    }
  }, [remaining, dateStr]);

  function dismiss() {
    try {
      sessionStorage.setItem(`${STORAGE_KEY}-${dateStr}`, "1");
    } catch {
      // ignore
    }
    setShowModal(false);
  }

  return (
    <Modal
      open={showModal}
      onClose={dismiss}
      title="Energiebudget overschreden"
      subtitle="Je hebt vandaag meer energie verbruikt dan je budget. De engine raadt aan om lichtere taken te doen of iets voor morgen te plannen."
      size="sm"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
          >
            Begrepen
          </button>
          <Link
            href="/tasks"
            onClick={dismiss}
            className="rounded-lg bg-[var(--accent-focus)] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
          >
            Naar missies →
          </Link>
        </div>
      }
    >
      <p className="text-sm text-[var(--text-secondary)]">
        Overweeg alleen nog lichte missies vandaag of verplaats taken naar morgen. Zo blijf je binnen je mentale capaciteit.
      </p>
    </Modal>
  );
}
