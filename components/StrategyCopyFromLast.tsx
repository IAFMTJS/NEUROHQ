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
      className="rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2 text-sm font-medium text-neuro-silver hover:border-neuro-blue hover:text-neuro-blue disabled:opacity-50"
    >
      {pending ? "Copying…" : "Copy from last quarter"}
    </button>
  );
}
