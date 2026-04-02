/** Shared copy for mission-page subtle warnings (MissionsEngineWarningIcon). */

export type MissionEngineWarningsInput = {
  /** Focus slots / load hint from TaskList (hidden in war mode). */
  limitMessage?: string | null;
  energyDepleted?: boolean;
  recoveryOnly?: boolean;
  recoveryProtocol?: boolean;
  daysSinceLastCompletion?: number;
  zeroCompletionPenalty?: boolean;
  burnout?: boolean;
};

export function collectMissionEngineWarningLines(src: MissionEngineWarningsInput): string[] {
  const lines: string[] = [];
  const lm = src.limitMessage?.trim();
  if (lm) lines.push(lm);

  if (src.energyDepleted) {
    lines.push("Volgende missie kost 15% meer energie. Geen straf — wel even bewust plannen.");
  }
  if (src.recoveryOnly || src.burnout) {
    lines.push(
      src.burnout
        ? "Burnout-signaal: meerdere dagen lage energie en weinig voltooiingen. Alleen recovery-missies — kies iets lichts om op te laden."
        : "Hoge druk: alleen recovery-missies beschikbaar. Kies iets lichts om te stabiliseren."
    );
  }
  if (src.recoveryProtocol) {
    const d = src.daysSinceLastCompletion ?? 0;
    lines.push(
      `Recovery protocol: ${d} dag${d !== 1 ? "en" : ""} geen voltooiing. Kies een lichte missie om weer op te starten.`
    );
  }
  if (src.zeroCompletionPenalty) {
    lines.push("Gisteren geen voltooiing: vandaag +10 druk, -10% energie. Eén missie vandaag houdt je ritme vast.");
  }
  return lines;
}
