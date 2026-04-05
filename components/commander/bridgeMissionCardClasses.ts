import type { CSSProperties } from "react";

/** Dashboard bridge: zelfde schil voor Hoofdmissie-teaser en missie-CTA (zie .bridge-mission-pair-card in globals). */
export const BRIDGE_MISSION_CARD_CLASS =
  "bridge-mission-pair-card glass-card glass-preserve-decoration box-border flex h-full min-h-[52px] w-full flex-col justify-center !rounded-xl border border-[var(--card-border)] px-3 py-2.5 text-left font-inherit text-[var(--text-primary)] no-underline antialiased transition hover:border-[rgba(var(--mode-rgb),0.28)] appearance-none";

export const BRIDGE_MISSION_EYEBROW_CLASS =
  "text-[9px] font-semibold uppercase tracking-[0.12em]";

export const bridgeMissionEyebrowStyle: CSSProperties = {
  color: "rgba(var(--mode-rgb), 0.78)",
};

export const BRIDGE_MISSION_BODY_CLASS =
  "mt-0.5 line-clamp-2 text-[12px] leading-snug text-[var(--text-primary)]";

export const BRIDGE_MISSION_CTA_FOCUS_CLASS =
  "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]";
