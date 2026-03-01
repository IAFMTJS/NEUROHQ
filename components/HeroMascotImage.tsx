"use client";

import Image from "next/image";
import { getMascotSrcForPage, MASCOT_VARIANT_TO_PAGE, type DashboardPage } from "@/lib/mascots";

export type HeroMascotVariant = keyof typeof MASCOT_VARIANT_TO_PAGE;

const FALLBACK_SRC = "/app-icon.png";

/** When true, render at fixed large size so the layout box can stay small and the PNG overflows (big mascot, small square). */
const HERO_LARGE_WIDTH = 320;
const HERO_LARGE_HEIGHT = 380;

type HeroMascotImageProps = {
  /** Current page (route segment). When set, mascot is chosen by page name; overrides variant. */
  page?: DashboardPage;
  /** Fallback when page is not set. Maps to page then to file (files are named after pages). */
  variant?: HeroMascotVariant;
  /** Optional class for the img (e.g. mascot-img in hero layout). */
  className?: string;
  /** When true, use fixed large dimensions so image can overflow a small container (big PNG, small layout box). */
  heroLarge?: boolean;
};

export function HeroMascotImage({ page, variant = "homepage", className, heroLarge }: HeroMascotImageProps) {
  const routePage = page ?? MASCOT_VARIANT_TO_PAGE[variant];
  const heroSrc = getMascotSrcForPage(routePage);

  if (heroLarge) {
    return (
      <span className="mascot-hero-img-wrap">
        <Image
          src={heroSrc}
          alt=""
          width={HERO_LARGE_WIDTH}
          height={HERO_LARGE_HEIGHT}
          sizes="(max-width: 420px) 88vw, 320px"
          className={`mascot-img object-contain object-[center_top] ${className ?? ""}`.trim()}
          priority
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            if (el?.src && !el.src.endsWith(FALLBACK_SRC)) el.src = FALLBACK_SRC;
          }}
        />
      </span>
    );
  }

  return (
    <Image
      src={heroSrc}
      alt=""
      fill
      sizes="(max-width: 420px) 96vw, 420px"
      className={`object-contain object-[center_0%] ${className ?? ""}`.trim()}
      priority
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        if (el?.src && !el.src.endsWith(FALLBACK_SRC)) el.src = FALLBACK_SRC;
      }}
    />
  );
}
