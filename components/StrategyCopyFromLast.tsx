"use client";

import { useTransition } from "react";
import { copyStrategyFromLastQuarter } from "@/app/actions/strategy";

type Props = { hasLastQuarter: boolean };

export function StrategyCopyFromLast({ hasLastQuarter }: Props) {
  const [pending, startTransition] = useTransition();
  if (!hasLastQuarter) return null;
  return (
    <button
      type="button"
      onClick={() => startTransition(() => copyStrategyFromLastQuarter())}
      disabled={pending}
      className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)] disabled:opacity-50"
    >
      {pending ? "Copying…" : "Copy from last quarter"}
    </button>
  );
}
