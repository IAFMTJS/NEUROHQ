import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Applied to inner padded content wrapper (e.g. `min-h-0 flex-1` for fill-height layouts). */
  contentClassName?: string;
  /** Extra gradient layer (e.g. warm tint for notifications); above base flares, below content. */
  accentFlareClassName?: string;
};

/** Command deck shell — same markup as TasksTabsShell `commandDeck` (dual top flares, border 0.28). */
export function VisualLabCommandDeck({ children, className = "", contentClassName = "", accentFlareClassName }: Props) {
  return (
    <div
      className={`tasks-command-deck dashboard-cinematic relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.32)] bg-gradient-to-br from-[rgba(6,22,38,0.97)] via-[var(--bg-elevated)]/88 to-[rgba(var(--mode-rgb-deep),0.18)] shadow-[0_0_48px_rgba(var(--mode-rgb),0.16),0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(var(--mode-rgb),0.16),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(var(--mode-rgb),0.1),transparent_55%)]"
        aria-hidden
      />
      {accentFlareClassName ? (
        <div className={`pointer-events-none absolute inset-0 ${accentFlareClassName}`} aria-hidden />
      ) : null}
      <div className={`relative z-[1] flex flex-col gap-0 p-4 md:p-5 ${contentClassName}`.trim()}>{children}</div>
    </div>
  );
}
