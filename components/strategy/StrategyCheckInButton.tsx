"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStrategyCheckIn } from "@/app/actions/strategy";

export function StrategyCheckInButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleCheckIn() {
    startTransition(async () => {
      await setStrategyCheckIn();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleCheckIn}
      disabled={pending}
      className="rounded-lg border border-[var(--accent-focus)] bg-[var(--accent-focus)]/10 px-4 py-2 text-sm font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20 disabled:opacity-50"
    >
      {pending ? "Bezig…" : "Check-in gedaan"}
    </button>
  );
}
