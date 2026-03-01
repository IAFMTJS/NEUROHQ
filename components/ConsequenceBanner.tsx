"use client";

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
  if (!energyDepleted && !recoveryOnly && !recoveryProtocol && !zeroCompletionPenalty && !burnout) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/95">
      <ul className="list-inside list-disc space-y-1">
        {energyDepleted && (
          <li>Volgende missie kost 15% meer energie. Geen straf — wel even bewust plannen.</li>
        )}
        {(recoveryOnly || burnout) && (
          <li>
            {burnout
              ? "Burnout-signaal: meerdere dagen lage energie en weinig voltooiingen. Alleen recovery-missies — kies iets lichts om op te laden."
              : "Hoge druk: alleen recovery-missies beschikbaar. Kies iets lichts om te stabiliseren."}
          </li>
        )}
        {recoveryProtocol && (
          <li>
            Recovery protocol: {daysSinceLastCompletion} dag{daysSinceLastCompletion !== 1 ? "en" : ""} geen voltooiing.
            Kies een lichte missie om weer op te starten.
          </li>
        )}
        {zeroCompletionPenalty && (
          <li>Gisteren geen voltooiing: vandaag +10 druk, -10% energie. Eén missie vandaag houdt je ritme vast.</li>
        )}
      </ul>
    </div>
  );
}
