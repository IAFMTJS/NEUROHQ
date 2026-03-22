"use client";

import Link from "next/link";

type Props = {
  /** True when daily brain check-in state is missing — suggestions are less reliable. */
  brainStateMissing?: boolean;
  /** User chose a manual mode override for today (localStorage). */
  manualOverrideActive?: boolean;
  /** Suggested mode from engine differs from current (e.g. auto vs override conflict). */
  suggestionDiffersFromCurrent?: boolean;
  className?: string;
};

/**
 * Shared copy for Focus / War / Recovery — used in Commander card modal and Settings.
 */
export function DcicModeHelpContent({
  brainStateMissing,
  manualOverrideActive,
  suggestionDiffersFromCurrent,
  className = "",
}: Props) {
  return (
    <div className={`space-y-3 text-sm text-[var(--text-secondary)] ${className}`}>
      {brainStateMissing ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-100">
          Je hebt je <strong>brain status</strong> vandaag nog niet ingevuld. Modus-suggesties zijn dan minder
          betrouwbaar — vul eerst je check-in in op het dashboard.
        </p>
      ) : null}

      <ul className="list-disc space-y-2 pl-4">
        <li>
          <strong className="text-[var(--text-primary)]">Recovery</strong> wordt voorgetrokken bij lage energie, zeer hoge
          load, of een crash-/drain brain state (bescherming eerst).
        </li>
        <li>
          <strong className="text-[var(--text-primary)]">War</strong> kan worden voorgesteld bij peak/optimal state én sterke
          focus/energie — je kunt het activeren in je missie-flow.
        </li>
        <li>
          <strong className="text-[var(--text-primary)]">Focus</strong> is de standaard. Je kunt waar de app het toestaat een{" "}
          <strong>handmatige override</strong> gebruiken (bijv. test in Instellingen).
        </li>
      </ul>

      {manualOverrideActive ? (
        <p className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-muted)]">
          Je hebt vandaag een <strong className="text-[var(--text-secondary)]">eigen moduskeuze</strong> (override). Dat gaat
          voor op automatische suggesties totdat je het reset of de dag om is.
        </p>
      ) : null}

      {suggestionDiffersFromCurrent && !manualOverrideActive ? (
        <p className="text-xs text-[var(--text-muted)]">
          Zie je een <strong>suggestie</strong> die niet overeenkomt met je actieve modus? Dat is normaal: suggesties zijn
          advies; je actieve modus volgt je laatste keuze of systeemregels tot je iets wijzigt.
        </p>
      ) : null}

      <p className="text-xs text-[var(--text-muted)]">
        Meer context:{" "}
        <Link href="/dashboard" className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
          Dashboard
        </Link>{" "}
        (brain + Commander status).
      </p>
    </div>
  );
}
