"use client";

import { collectMissionEngineWarningLines } from "@/lib/mission-engine-warnings";

/** Neutral friction messages from Resource & Consequence Engine (Fase 2). No guilt. */
type Props = {
  /** Volgende missie kost 15% meer. */
  energyDepleted?: boolean;
  /** Alleen recovery-missies beschikbaar. */
  recoveryOnly?: boolean;
  /** 5+ dagen geen voltooiing. */
  recoveryProtocol?: boolean;
  daysSinceLastCompletion?: number;
  /** Fase 4: gisteren 0 voltooiingen → vandaag +10 druk, -10% energie. */
  zeroCompletionPenalty?: boolean;
  /** Fase 6: burnout → recovery-first, sociale missies beperkt. */
  burnout?: boolean;
};

export function ConsequenceBanner({
  energyDepleted,
  recoveryOnly,
  recoveryProtocol,
  daysSinceLastCompletion = 0,
  zeroCompletionPenalty,
  burnout,
}: Props) {
  const lines = collectMissionEngineWarningLines({
    limitMessage: null,
    energyDepleted,
    recoveryOnly,
    recoveryProtocol,
    daysSinceLastCompletion,
    zeroCompletionPenalty,
    burnout,
  });
  if (lines.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/95">
      <ul className="list-inside list-disc space-y-1">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
