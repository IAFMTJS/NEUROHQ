import type { CSSProperties } from "react";

/** Dashboard bridge: zelfde schil voor Hoofdmissie-teaser en missie-CTA. */
export const BRIDGE_MISSION_CARD_CLASS =
  "glass-card glass-preserve-decoration flex min-h-[48px] w-full flex-col justify-center rounded-xl border border-[var(--card-border)] px-3 py-2.5 text-left no-underline transition hover:border-[rgba(var(--mode-rgb),0.28)]";

export const BRIDGE_MISSION_EYEBROW_CLASS =
  "text-[9px] font-semibold uppercase tracking-[0.12em]";

export const bridgeMissionEyebrowStyle: CSSProperties = {
  color: "rgba(var(--mode-rgb), 0.78)",
};

export const BRIDGE_MISSION_BODY_CLASS =
  "mt-0.5 line-clamp-2 text-[12px] leading-snug text-[var(--text-primary)]";

export const BRIDGE_MISSION_CTA_FOCUS_CLASS =
  "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]";
