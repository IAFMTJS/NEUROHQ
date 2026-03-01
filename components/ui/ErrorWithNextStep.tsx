"use client";

type Props = {
  /** Error message (what went wrong). */
  message: string;
  /** Suggested next step (e.g. "Controleer de velden en probeer opnieuw."). */
  nextStep?: string | null;
  /** Optional link for recovery (e.g. /assistant). */
  recoveryHref?: string | null;
  recoveryLabel?: string | null;
  className?: string;
};

/** Standard error state: message + next step (spec: "Error states: geef direct error + next step"). */
export function ErrorWithNextStep({
  message,
  nextStep,
  recoveryHref,
  recoveryLabel,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200 ${className}`}
      role="alert"
    >
      <p className="font-medium">{message}</p>
      {nextStep && <p className="mt-1 text-amber-200/90">{nextStep}</p>}
      {recoveryHref && (
        <a
          href={recoveryHref}
          className="mt-2 inline-block rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/30"
        >
          {recoveryLabel ?? "Naar assistant"}
        </a>
      )}
    </div>
  );
}
