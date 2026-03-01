"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarModal3 } from "./CalendarModal3";

type Props = {
  date: string;
  /** If not provided, navigates to /tasks?add=<date> to open Add Mission with that date. */
  onAddMicroMission?: (date: string) => void;
};

export function CalendarModal3Trigger({ date, onAddMicroMission }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleAddMicro(targetDate: string) {
    if (onAddMicroMission) {
      onAddMicroMission(targetDate);
      router.refresh();
    } else {
      router.push(`/tasks?add=${targetDate}`);
    }
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
      >
        📅 Week planner 3.0
      </button>
      <CalendarModal3 open={open} onClose={() => setOpen(false)} initialDate={date} onAddMicroMission={handleAddMicro} />
    </>
  );
}
