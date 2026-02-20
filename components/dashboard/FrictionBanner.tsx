"use client";

import type { FrictionSignal } from "@/app/actions/friction";

type Props = {
  signals: FrictionSignal[];
};

/** Shown when friction detected: "Resistance detected" + suggest micro-task. */
export function FrictionBanner({ signals }: Props) {
  if (signals.length === 0) return null;

  const first = signals[0];
  return (
    <div
      className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
      role="status"
    >
      <p className="font-medium">Resistance detected</p>
      <p className="mt-0.5 text-amber-200/90">{first.message}</p>
      {first.suggestMicroTask && (
        <p className="mt-1 text-xs text-amber-200/80">
          Tip: Deel op in kleinere stappen of start met een micro-missie.
        </p>
      )}
    </div>
  );
}
