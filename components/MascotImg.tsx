"use client";

import { getMascotSrcForPage, type DashboardPage, type XPMascotState } from "@/lib/mascots";

const FALLBACK_PAGE: DashboardPage = "dashboard";

type Props = {
  page: DashboardPage;
  state?: XPMascotState | string;
  alt?: string;
  className?: string;
};

/** Renders mascot img with fallback to dashboard mascot when the page asset is missing (404). */
export function MascotImg({ page, state, alt = "", className }: Props) {
  const fallbackSrc = getMascotSrcForPage(FALLBACK_PAGE);
  const emergencyFallbackSrc = "/stars.png";

  return (
    <img
      src={getMascotSrcForPage(page, state)}
      alt={alt}
      className={className}
      onError={(e) => {
        const el = e.currentTarget;
        const stage = el.dataset.fallbackStage ?? "0";
        if (stage === "0") {
          el.dataset.fallbackStage = "1";
          el.src = fallbackSrc;
          return;
        }
        if (stage === "1") {
          el.dataset.fallbackStage = "2";
          el.src = emergencyFallbackSrc;
        }
      }}
    />
  );
}
