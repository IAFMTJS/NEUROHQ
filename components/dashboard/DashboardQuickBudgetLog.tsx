"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { AddBudgetEntryForm } from "@/components/AddBudgetEntryForm";
import styles from "@/components/hud-test/hud.module.css";

/** Opens a modal to log an expense directly instead of navigating to budget page. */
export function DashboardQuickBudgetLog() {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${styles.outlineButton} dashboard-hud-chip shrink-0 whitespace-nowrap rounded-[10px] px-2 text-[9px] font-semibold normal-case tracking-[0.03em] inline-flex items-center justify-center`}
        style={{ height: "26px", minHeight: "26px", paddingTop: 0, paddingBottom: 0, paddingLeft: "6px", paddingRight: "6px" }}
        aria-label="Snel uitgave loggen"
      >
        <span className="relative z-10">Log uitgave</span>
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Log uitgave"
        subtitle="Voeg een uitgave of inkomsten toe"
        size="lg"
      >
        <AddBudgetEntryForm
          date={today}
          currency="EUR"
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
