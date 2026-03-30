import type { ReactNode } from "react";
import { dashboardCommandDeckOuterClass } from "@/components/layout/DashboardCommandDeckFrame";

type Props = {
  children: ReactNode;
  className?: string;
  /** Applied to inner padded content wrapper (e.g. `min-h-0 flex-1` for fill-height layouts). */
  contentClassName?: string;
  /** Extra gradient layer (e.g. warm tint for notifications); above base flares, below content. */
  accentFlareClassName?: string;
};

/**
 * Visual-lab / concept previews: same outer shell as production {@link DashboardCommandDeckFrame}
 * but without the “Command” title row (concepts supply their own chrome).
 */
export function VisualLabCommandDeck({ children, className = "", contentClassName = "", accentFlareClassName }: Props) {
  return (
    <div className={`${dashboardCommandDeckOuterClass} ${className}`.trim()}>
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
