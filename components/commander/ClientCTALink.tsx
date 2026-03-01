"use client";

import { trackEvent } from "@/app/actions/analytics-events";
import { HudLinkButton } from "@/components/hud-test/HudLinkButton";

type Props = {
  href: string;
  label: string;
  className?: string;
  children: React.ReactNode;
  tone?: "glass" | "outline" | "alert";
  /** When true, apply subtle pulse animation (streak at risk). */
  streakAtRisk?: boolean;
};

/** CTA link that tracks CTA_clicked on click. */
export function ClientCTALink({ href, label, className, children, tone = "glass", streakAtRisk }: Props) {
  return (
    <HudLinkButton
      href={href}
      tone={tone}
      className={`${className ?? ""} ${streakAtRisk ? "cta-streak-pulse" : ""}`}
      onClick={() => trackEvent("CTA_clicked", { label, href })}
    >
      {children}
    </HudLinkButton>
  );
}
