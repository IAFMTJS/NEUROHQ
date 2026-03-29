import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Extra gradient layer (e.g. warm tint for notifications); above base flares, below content. */
  accentFlareClassName?: string;
};

/** Command deck shell — globals `.tasks-command-deck.dashboard-cinematic` (hub nested glass; Missies concept parity). */
export function VisualLabCommandDeck({ children, className = "", accentFlareClassName }: Props) {
  return (
    <div className={`tasks-command-deck dashboard-cinematic relative overflow-hidden rounded-2xl ${className}`}>
      {accentFlareClassName ? (
        <div className={`pointer-events-none absolute inset-0 z-[1] ${accentFlareClassName}`} aria-hidden />
      ) : null}
      <div className="tasks-command-deck-inner flex flex-col gap-0 p-4 md:p-5">{children}</div>
    </div>
  );
}
