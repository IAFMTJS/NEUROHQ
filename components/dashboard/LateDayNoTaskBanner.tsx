"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Modal } from "@/components/Modal";

const STORAGE_KEY = "neurohq-late-day-no-task-banner";
const HOUR_THRESHOLD = 20;

/** Show a modal popup when it's 20:00 or later and user hasn't completed any task today. Dismissible per day. */
export function LateDayNoTaskBanner({
  completedTodayCount,
  dateStr,
}: {
  completedTodayCount: number;
  dateStr: string;
}) {
  const [visible, setVisible] = useState(false);
  const [isLate, setIsLate] = useState(false);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const isLateDay = hour >= HOUR_THRESHOLD;
    setIsLate(isLateDay);
    if (!isLateDay || completedTodayCount > 0) return;
    try {
      const key = `${STORAGE_KEY}-${dateStr}`;
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key) === "1") return;
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [completedTodayCount, dateStr]);

  function dismiss() {
    try {
      sessionStorage.setItem(`${STORAGE_KEY}-${dateStr}`, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  const showModal = visible && isLate && completedTodayCount === 0;

  return (
    <Modal
      open={showModal}
      onClose={dismiss}
      title="Nog geen missie vandaag"
      subtitle={`Het is na ${HOUR_THRESHOLD}:00 en je hebt vandaag nog geen taak voltooid. Eén kleine actie helpt je streak en momentum.`}
      size="sm"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
          >
            Sluiten
          </button>
          <Link
            href="/tasks"
            onClick={dismiss}
            className="rounded-lg bg-[var(--accent-focus)] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
          >
            Kleine actie doen →
          </Link>
        </div>
      }
    >
      <p className="text-sm text-[var(--text-secondary)]">
        Kies één korte missie op de Missions-pagina om vandaag nog te voltooien. Zo blijf je op koers en behoud je je streak.
      </p>
    </Modal>
  );
}
