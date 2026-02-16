"use client";

import Image from "next/image";

export type HeroMascotVariant =
  | "homepage"
  | "missions"
  | "assistant"
  | "analytics"
  | "budget"
  | "report"
  | "growth"
  | "strategy"
  | "settings";

/** Mascots from "New styling idea" folder – file names = page names (e.g. "Budget page.png", "Mission page.png"). */
const HERO_MASCOT_SRC_BY_VARIANT: Record<HeroMascotVariant, string> = {
  homepage: "/mascots/Homepage%20Mascotte.png",
  missions: "/mascots/Mission%20page.png",
  assistant: "/mascots/page.png",
  analytics: "/mascots/page.png",
  budget: "/mascots/Budget%20page.png",
  report: "/mascots/page.png",
  growth: "/mascots/Growth%20page.png",
  strategy: "/mascots/Strategy%20page.png",
  settings: "/mascots/Settings%20page.png",
};
const FALLBACK_SRC = "/app-icon.png";

type HeroMascotImageProps = {
  variant?: HeroMascotVariant;
};

export function HeroMascotImage({ variant = "homepage" }: HeroMascotImageProps) {
  const heroSrc = HERO_MASCOT_SRC_BY_VARIANT[variant];

  return (
    <Image
      src={heroSrc}
      alt=""
      fill
      sizes="(max-width: 768px) 85vw, 80vh"
      className="object-contain"
      priority
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        if (el?.src && !el.src.endsWith(FALLBACK_SRC)) el.src = FALLBACK_SRC;
      }}
    />
  );
}
