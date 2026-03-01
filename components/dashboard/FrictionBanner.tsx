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
      className="dashboard-hud-alert px-4 py-3 text-sm"
      role="status"
    >
      <p className="font-medium">Resistance detected</p>
      <p className="mt-0.5">{first.message}</p>
      {first.suggestMicroTask && (
        <p className="mt-1 text-xs">
          Tip: Deel op in kleinere stappen of start met een micro-missie.
        </p>
      )}
    </div>
  );
}
