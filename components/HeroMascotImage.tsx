"use client";

import Image from "next/image";
import { getMascotSrcForPage, MASCOT_VARIANT_TO_PAGE, type DashboardPage } from "@/lib/mascots";

export type HeroMascotVariant = keyof typeof MASCOT_VARIANT_TO_PAGE;

const FALLBACK_SRC = "/app-icon.png";

type HeroMascotImageProps = {
  /** Current page (route segment). When set, mascot is chosen by page name; overrides variant. */
  page?: DashboardPage;
  /** Fallback when page is not set. Maps to page then to file (files are named after pages). */
  variant?: HeroMascotVariant;
  /** Optional class for the img (e.g. mascot-img in hero layout). */
  className?: string;
};

export function HeroMascotImage({ page, variant = "homepage", className }: HeroMascotImageProps) {
  const routePage = page ?? MASCOT_VARIANT_TO_PAGE[variant];
  const heroSrc = getMascotSrcForPage(routePage);

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
